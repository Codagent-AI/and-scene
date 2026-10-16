#!/usr/bin/env node
// Deterministic build + real-browser render gate. Usage:
//   node scripts/verify.mjs [--root <dir>] [--slug <slug>]...
// Reference sample + normative outline come from the `presentationVerification`
// key of the root package.json; without it every registered presentation is rendered.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

export const HOST = '127.0.0.1'
const STEP_SETTLE_MS = 700
const ADVANCE_TIMEOUT_MS = 4000

// ---------- pure helpers (unit-tested) ----------

/** Strip // and block comments so commented-out registry entries are ignored. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
}

/** Parse `{ slug, title, load: () => import('./dir/Talk') }` entries out of the registry source. */
export function parseRegistry(source) {
  const re =
    /\{\s*slug\s*:\s*(['"`])([^'"`]+)\1\s*,\s*title\s*:\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)\s*,\s*load\s*:\s*\(\s*\)\s*=>\s*import\(\s*(['"`])([^'"`]+)\6\s*\)\s*,?\s*\}/g
  const entries = []
  for (const m of stripComments(source).matchAll(re)) {
    entries.push({ slug: m[2], title: m[3] ?? m[4] ?? m[5] ?? '', loadPath: m[7] })
  }
  return entries
}

/** Compare the normative outline with what the browser observed; returns problem strings. */
export function compareOutline(expected, observed) {
  const problems = []
  const n = Math.max(expected.length, observed.length)
  for (let i = 0; i < n; i++) {
    const e = expected[i]
    const o = observed[i]
    if (!e) {
      problems.push(`unexpected extra step ${i + 1}: "${o.title}"`)
    } else if (!o) {
      problems.push(`missing step ${i + 1}: expected "${e.title}"`)
    } else {
      if (e.title !== o.title) {
        const elsewhere = expected.findIndex((x) => x.title === o.title)
        problems.push(
          `step ${i + 1} title is "${o.title}", expected "${e.title}"` +
            (elsewhere >= 0 ? ` (out of order: that title belongs at step ${elsewhere + 1})` : ''),
        )
      }
      if (e.caption !== o.caption) problems.push(`step ${i + 1} caption is "${o.caption}", expected "${e.caption}"`)
    }
  }
  return problems
}

/** Decide which presentations the render phase covers. */
export function selectSlugs({ reference, registry, slugs }) {
  if (reference) return [...new Set([reference.slug, ...slugs])]
  return [...new Set([...registry.map((e) => e.slug), ...slugs])]
}

/** Results: [{ phase, ok, detail?, failures?: [{ slug?, step?, message }] }] → printable report + exit code. */
export function formatReport(results) {
  const lines = []
  for (const r of results) {
    lines.push(`${r.ok ? 'ok  ' : 'FAIL'} ${r.phase}${r.detail ? `: ${r.detail}` : ''}`)
    for (const f of r.failures ?? []) {
      const where = [f.slug ? `slug "${f.slug}"` : '', f.step !== undefined ? `step index ${f.step}` : '']
        .filter(Boolean)
        .join(', ')
      lines.push(`       - ${where ? `[${where}] ` : ''}${f.message}`)
    }
  }
  const failed = results.filter((r) => !r.ok)
  if (failed.length === 0) {
    lines.push('PASS')
    return { lines, exitCode: 0 }
  }
  const named = failed.map((r) => {
    const f = (r.failures ?? [])[0]
    const where = [f?.slug ? `slug "${f.slug}"` : '', f?.step !== undefined ? `step index ${f.step}` : '']
      .filter(Boolean)
      .join(', ')
    return `${r.phase}${where ? ` (${where})` : ''}`
  })
  lines.push(`FAIL: ${named.join('; ')}`)
  return { lines, exitCode: 1 }
}

export function parseArgs(argv) {
  const out = { root: undefined, slugs: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--slug') out.slugs.push(argv[++i])
    else if (a.startsWith('--slug=')) out.slugs.push(a.slice(7))
    else if (a === '--root') out.root = argv[++i]
    else if (a.startsWith('--root=')) out.root = a.slice(7)
  }
  return out
}

// ---------- process helpers ----------

function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', (e) => resolve({ code: 1, out: String(e) }))
    child.on('close', (code) => resolve({ code: code ?? 1, out }))
  })
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    s.once('error', reject)
    s.listen(0, HOST, () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
  })
}

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => req.destroy())
  })
}

async function waitReady(url, child, timeoutMs = 30000) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (child.exitCode !== null) return false
    if (await probe(url)) return true
    await new Promise((r) => setTimeout(r, 150))
  }
  return false
}

function killTree(child) {
  if (!child || child.exitCode !== null) return
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    try {
      child.kill('SIGTERM')
    } catch {
      /* already gone */
    }
  }
}

// ---------- browser render ----------

async function renderPresentation(browser, baseUrl, slug, outline) {
  const failures = []
  const observed = []
  const page = await browser.newPage()
  let current = 0
  const fail = (message) => failures.push({ slug, step: current, message })
  page.on('console', (m) => {
    if (m.type() === 'error') fail(`console.error: ${m.text()}`)
  })
  page.on('pageerror', (e) => fail(`uncaught error: ${e.message}`))
  const readIndex = () =>
    page.locator('[data-step-index]').first().getAttribute('data-step-index', { timeout: 1000 }).then(Number, () => NaN)
  try {
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 15000 })
    } catch {
      fail('route did not render a presentation (no data-step-count hook)')
      return { failures, observed }
    }
    const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) {
      fail(`invalid data-step-count`)
      return { failures, observed }
    }
    if (outline && (await page.locator('[data-presentation-mode]').first().getAttribute('data-presentation-mode')) !== 'browse') {
      await page.keyboard.press('p')
    }
    const capture = async () => {
      if (!outline) return
      const text = (sel) => page.locator(sel).first().textContent({ timeout: 1000 }).catch(() => null)
      observed.push({ title: (await text('[data-presentation-title]'))?.trim() ?? '', caption: (await text('[data-presentation-caption]'))?.trim() ?? '' })
    }
    await page.waitForTimeout(STEP_SETTLE_MS)
    if ((await readIndex()) !== 0) fail(`presentation did not start at step index 0`)
    await capture()
    for (let i = 0; i < count - 1; i++) {
      current = i + 1
      await page.keyboard.press('ArrowRight')
      const deadline = Date.now() + ADVANCE_TIMEOUT_MS
      let idx = await readIndex()
      while (idx !== i + 1 && Date.now() < deadline) {
        await page.waitForTimeout(100)
        idx = await readIndex()
      }
      if (idx !== i + 1) {
        fail(`transition failed: data-step-index stayed at ${Number.isNaN(idx) ? 'missing' : idx}, expected ${i + 1}`)
        break
      }
      await page.waitForTimeout(STEP_SETTLE_MS)
      await capture()
    }
  } finally {
    await page.close().catch(() => {})
  }
  return { failures, observed }
}

// ---------- main ----------

export async function verify({ root, slugs = [], log = console.log }) {
  const results = []
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  const reference = pkg.presentationVerification?.reference
  const emit = () => formatReport(results)
  let preview
  let browser
  const cleanup = async () => {
    await browser?.close().catch(() => {})
    killTree(preview)
  }
  const onSignal = (sig) => {
    cleanup().finally(() => process.exit(sig === 'SIGINT' ? 130 : 143))
  }
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)

  try {
    // 1. build
    const build = await run('npm', ['run', 'build'], root)
    if (build.code !== 0) {
      results.push({
        phase: 'build',
        ok: false,
        detail: 'npm run build failed',
        failures: [{ message: build.out.trim().split('\n').slice(-15).join('\n         ') }],
      })
      return emit()
    }
    results.push({ phase: 'build', ok: true, detail: 'npm run build succeeded' })
    log(formatReport(results).lines[0])

    // 2. sample / registry
    const indexPath = path.join(root, 'src/presentations/index.ts')
    const registry = existsSync(indexPath) ? parseRegistry(readFileSync(indexPath, 'utf8')) : []
    const sampleFailures = []
    if (registry.length === 0) sampleFailures.push({ message: 'no presentations are registered in src/presentations/index.ts' })
    if (reference && !registry.some((e) => e.slug === reference.slug)) {
      sampleFailures.push({ slug: reference.slug, message: `reference sample "${reference.slug}" is not registered` })
    }
    for (const s of slugs) {
      if (!registry.some((e) => e.slug === s)) sampleFailures.push({ slug: s, message: `slug "${s}" is not registered` })
    }
    for (const e of registry) {
      const rel = e.loadPath.replace(/^\.\//, '')
      const base = path.join(root, 'src/presentations', rel)
      if (!['.tsx', '.ts', '.jsx', '.js'].some((x) => existsSync(base + x)) && !existsSync(base)) {
        sampleFailures.push({ slug: e.slug, message: `registered module "${e.loadPath}" does not exist` })
      }
    }
    const toRender = selectSlugs({ reference, registry, slugs })
    if (sampleFailures.length > 0) {
      results.push({ phase: 'sample', ok: false, detail: 'registry check failed', failures: sampleFailures })
      return emit()
    }

    // 3. preview + browser
    const port = await freePort()
    const baseUrl = `http://${HOST}:${port}`
    const viteBin = path.join(root, 'node_modules/vite/bin/vite.js')
    preview = spawn(process.execPath, [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
      cwd: root,
      stdio: 'ignore',
      detached: true,
    })
    preview.on('error', () => {})
    log(`preview ${baseUrl}`)
    if (!(await waitReady(`${baseUrl}/`, preview))) {
      results.push({ phase: 'render', ok: false, detail: `preview did not become ready at ${baseUrl}`, failures: [{ message: 'vite preview failed to start' }] })
      return emit()
    }
    const requireFromRoot = createRequire(path.join(root, 'package.json'))
    const { chromium } = requireFromRoot('playwright')
    browser = await chromium.launch({ args: process.getuid?.() === 0 ? ['--no-sandbox'] : [] })

    const renderFailures = []
    let outlineProblems = []
    for (const slug of toRender) {
      const isRef = reference && slug === reference.slug
      const r = await renderPresentation(browser, baseUrl, slug, isRef ? reference.steps : null)
      renderFailures.push(...r.failures)
      // An aborted render only observed a prefix of the deck; compare just that prefix
      // so a render failure is not also reported as a pile of "missing step" noise.
      if (isRef) outlineProblems = compareOutline(r.failures.length === 0 ? reference.steps : reference.steps.slice(0, r.observed.length), r.observed)
    }
    if (reference) {
      results.push(
        outlineProblems.length === 0
          ? { phase: 'sample', ok: true, detail: `"${reference.slug}" registered; ${reference.steps.length} steps match the outline` }
          : {
              phase: 'sample',
              ok: false,
              detail: 'reference outline mismatch',
              failures: outlineProblems.map((message) => ({ slug: reference.slug, message })),
            },
      )
    } else {
      results.push({ phase: 'sample', ok: true, detail: `${registry.length} registered presentation(s)` })
    }
    results.push(
      renderFailures.length === 0
        ? { phase: 'render', ok: true, detail: `${toRender.join(', ')} rendered every step without errors` }
        : { phase: 'render', ok: false, detail: 'render check failed', failures: renderFailures },
    )
    return emit()
  } catch (e) {
    results.push({ phase: 'render', ok: false, detail: 'unexpected error', failures: [{ message: String(e?.stack ?? e) }] })
    return emit()
  } finally {
    await cleanup()
    process.off('SIGINT', onSignal)
    process.off('SIGTERM', onSignal)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = parseArgs(process.argv.slice(2))
  const root = path.resolve(args.root ?? process.cwd())
  const { lines, exitCode } = await verify({ root, slugs: args.slugs })
  // Phase lines already printed live (build); print the remainder.
  const printed = lines[0]?.startsWith('ok   build') ? 1 : 0
  for (const l of lines.slice(printed)) console.log(l)
  process.exit(exitCode)
}
