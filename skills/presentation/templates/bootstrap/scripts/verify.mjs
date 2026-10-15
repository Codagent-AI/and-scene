#!/usr/bin/env node
// Deterministic verification gate: build -> sample -> render.
//
// Per-project expectations live in scripts/verify.config.json.
//
// Usage: node scripts/verify.mjs [--root <dir>] [--slug <slug>] [--timeout <ms>]
//   --root     project root to verify (default: the repository root)
//   --slug     sample route to render (default: SAMPLE.slug)
// Env equivalents: VERIFY_ROOT, VERIFY_SLUG, VERIFY_TIMEOUT.
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOST, advanceTo, isEntryPoint, startPreview } from './preview-lib.mjs'

// ---- Project-specific expectations: scripts/verify.config.json (the only per-project input) ----
// { "slug", "registry", "dir"?, "steps"? }. `dir` + `steps` (era/title/caption) enable the
// ordered outline check; without them the sample phase only confirms `slug` is registered
// and the render phase is a route smoke check. The same script serves the repository's
// nine-step reference sample and the bootstrap template's starter presentation.
const CONFIG_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'verify.config.json')
export const SAMPLE = { registry: 'src/presentations/index.ts', steps: [], ...JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) }
// ------------------------------------------------------------------------------

const MAX_TIMEOUT_MS = 2 ** 31 - 1 // largest delay setTimeout supports
const SETTLE_MS = 1300 // layout move + newcomer enter + scene fade, with margin

function parseArgs(argv, env) {
  const opts = {
    root: env.VERIFY_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    slug: env.VERIFY_SLUG || SAMPLE.slug,
    timeout: Number(env.VERIFY_TIMEOUT || 120000),
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--root') opts.root = path.resolve(argv[++i])
    else if (a === '--slug') opts.slug = argv[++i]
    else if (a === '--timeout') opts.timeout = Number(argv[++i])
    else throw new Error(`unknown argument: ${a}`)
  }
  opts.root = path.resolve(opts.root)
  if (!Number.isFinite(opts.timeout) || opts.timeout <= 0 || opts.timeout > MAX_TIMEOUT_MS) {
    throw new Error(`timeout must be a positive number of ms no greater than ${MAX_TIMEOUT_MS}, got ${opts.timeout}`)
  }
  return opts
}

class PhaseError extends Error {}

function runBuild(root) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new PhaseError(`npm run build exited with code ${code}\n${out.trim().split('\n').slice(-25).join('\n')}`))
    })
  })
}

const hasOutline = SAMPLE.steps.length > 0 && Boolean(SAMPLE.dir)

function checkSample(root, slug) {
  const dir = hasOutline ? path.join(root, SAMPLE.dir) : ''
  if (hasOutline && !existsSync(dir)) throw new PhaseError(`reference sample directory missing: ${SAMPLE.dir}`)
  const registryFile = path.join(root, SAMPLE.registry)
  if (!existsSync(registryFile)) throw new PhaseError(`registry missing: ${SAMPLE.registry}`)
  const registry = readFileSync(registryFile, 'utf8')
  // Strip comments while leaving string literals (which may contain `//`) intact.
  const code = registry.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (_, str) => str ?? '')
  const registered = [...code.matchAll(/(?<![\w$])slug\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
  if (!registered.includes(slug)) {
    throw new PhaseError(`sample "${slug}" is not registered in ${SAMPLE.registry}`)
  }
  if (!hasOutline) return
  const stepsDir = path.join(dir, 'steps')
  const files = existsSync(stepsDir) ? readdirSync(stepsDir).filter((f) => /\.tsx?$/.test(f)).sort() : []
  if (files.length === 0) throw new PhaseError(`no step sources found in ${SAMPLE.dir}/steps`)
  const source = files.map((f) => readFileSync(path.join(stepsDir, f), 'utf8')).join('\n')
  let cursor = 0
  SAMPLE.steps.forEach((s, i) => {
    for (const [label, text] of [['title', s.title], ['caption', s.caption]]) {
      const at = source.indexOf(text, cursor)
      if (at < 0) {
        const anywhere = source.includes(text)
        throw new PhaseError(`step ${i} ${label} ${anywhere ? 'is out of order' : 'is missing or retitled'}: ${JSON.stringify(text)}`)
      }
      cursor = at + text.length
    }
  })
}

async function renderSample(root, slug) {
  const { chromium } = await import('playwright')
  const preview = await startPreview(root, PhaseError)
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    let current = -1 // step index errors are attributed to (-1 = load)
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push({ step: current, text: m.text() }) })
    page.on('pageerror', (e) => errors.push({ step: current, text: `uncaught: ${e.message}` }))
    const url = `${preview.origin}/${slug}`
    await page.goto(url, { waitUntil: 'load' })
    const root$ = page.locator('[data-presentation-root]')
    try {
      await root$.waitFor({ timeout: 10000 })
    } catch {
      throw new PhaseError(`no presentation root at ${url} (route missing or failed to render)${fmt(errors)}`)
    }
    const count = Number(await root$.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new PhaseError(`unreadable data-step-count at ${url}`)
    if (hasOutline && slug === SAMPLE.slug && count !== SAMPLE.steps.length) {
      throw new PhaseError(`expected ${SAMPLE.steps.length} steps, data-step-count is ${count}`)
    }
    const fail = (index, msg) => { throw new PhaseError(`step ${index}: ${msg}${fmt(errors)}`) }
    for (let i = 0; i < count; i++) {
      current = i
      const index = Number(await root$.getAttribute('data-step-index'))
      if (index !== i) fail(i, `data-step-index is ${index}, expected ${i} (transition did not advance)`)
      await page.waitForTimeout(SETTLE_MS)
      if (hasOutline && slug === SAMPLE.slug) {
        const title = (await page.locator('[data-presentation-step-title]').first().textContent())?.trim()
        const caption = (await page.locator('[data-presentation-caption]').first().textContent())?.trim()
        if (title !== SAMPLE.steps[i].title) fail(i, `title ${JSON.stringify(title)} != ${JSON.stringify(SAMPLE.steps[i].title)}`)
        if (caption !== SAMPLE.steps[i].caption) fail(i, `caption ${JSON.stringify(caption)} != ${JSON.stringify(SAMPLE.steps[i].caption)}`)
      }
      if (errors.length) fail(i, 'runtime/console error')
      if (i < count - 1) {
        current = i + 1 // errors raised while entering the next step belong to it
        if (!(await advanceTo(page, i + 1))) fail(i + 1, `ArrowRight from step ${i} did not advance data-step-index to ${i + 1}`)
      }
    }
    if (errors.length) fail(count - 1, 'runtime/console error')
    return count
  } finally {
    await browser?.close().catch(() => {})
    preview.stop()
  }
}

function fmt(errors) {
  return errors.length ? '\n' + errors.map((e) => `  [step ${e.step}] ${e.text}`).join('\n') : ''
}

export async function verify(opts) {
  const results = []
  let blocked = false
  const phases = [
    ['build', () => runBuild(opts.root).then(() => 'app builds')],
    ['sample', async () => { checkSample(opts.root, opts.slug); return hasOutline && opts.slug === SAMPLE.slug ? `${SAMPLE.steps.length} steps registered in order` : `"${opts.slug}" is registered` }],
    ['render', async () => `${await renderSample(opts.root, opts.slug)} steps rendered cleanly on ${HOST}`],
  ]
  for (const [name, run] of phases) {
    // build and sample are independent; render needs both to have passed.
    if (name === 'render' && blocked) {
      results.push({ name, status: 'SKIP', detail: 'blocked by earlier failure' })
      console.log(`SKIP ${name}: blocked by earlier failure`)
      continue
    }
    try {
      const detail = await run()
      results.push({ name, status: 'PASS', detail })
      console.log(`PASS ${name}: ${detail}`)
    } catch (err) {
      blocked = true
      const detail = err instanceof PhaseError ? err.message : `${err?.stack || err}`
      results.push({ name, status: 'FAIL', detail })
      console.log(`FAIL ${name}: ${detail}`)
    }
  }
  const failed = results.filter((r) => r.status === 'FAIL')
  console.log('')
  console.log(failed.length ? `VERIFY FAILED (${failed.map((f) => f.name).join(', ')})` : 'VERIFY PASSED (build, sample, render)')
  return failed.length ? 1 : 0
}

if (isEntryPoint(import.meta.url)) {
  let opts
  try { opts = parseArgs(process.argv.slice(2), process.env) } catch (e) { console.error(e.message); process.exit(2) }
  const timer = setTimeout(() => { console.log(`FAIL verify: overall timeout after ${opts.timeout}ms`); process.exit(1) }, opts.timeout)
  verify(opts).then((code) => { clearTimeout(timer); process.exit(code) })
}
