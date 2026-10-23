#!/usr/bin/env node
// Build + browser-render verification. Run with `npm run verify`.
//
// Usage: npm run verify [-- --slug <slug>] [-- --port <n>]
// Phases: build -> sample -> preview -> render. The reference sample (if
// `package.json#andScene.reference` is set) must be registered and match the
// outline file named by `package.json#andScene.outline`; every registered
// route is then stepped through in Chromium against a production preview.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const HOST = '127.0.0.1'
const STEP_TIMEOUT_MS = 3000
const SETTLE_MS = 250

export function previewUrl(port, route = '/') {
  return `http://${HOST}:${port}${route}`
}

export function registeredSlugs(registrySource) {
  return [...registrySource.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

export function registryHasSlug(registrySource, slug) {
  return registeredSlugs(registrySource).includes(slug)
}

/** Returns human-readable mismatches between the expected and rendered outline. */
export function compareOutline(expected, actual) {
  const problems = []
  if (expected.length !== actual.length) {
    problems.push(`expected ${expected.length} steps but rendered ${actual.length}`)
  }
  const n = Math.min(expected.length, actual.length)
  for (let i = 0; i < n; i++) {
    for (const field of ['era', 'title', 'caption']) {
      if (expected[i][field] !== actual[i][field]) {
        problems.push(
          `step ${i + 1} ${field}: expected ${JSON.stringify(expected[i][field])} but rendered ${JSON.stringify(actual[i][field])}`,
        )
      }
    }
  }
  return problems
}

/**
 * Which registered presentations to render: an explicit slug, else the reference, else all.
 * @param {{ slugs: string[], reference?: string, requested?: string }} opts
 * @returns {{ targets?: string[], error?: string }}
 */
export function selectTargets({ slugs, reference, requested }) {
  if (requested) {
    return slugs.includes(requested)
      ? { targets: [requested] }
      : { error: `"${requested}" is not registered in src/presentations/index.ts (registered: ${slugs.join(', ') || 'none'})` }
  }
  return { targets: reference ? [reference] : slugs }
}

export function pass(detail) {
  return { ok: true, detail }
}

export function fail(phase, message, step) {
  return { ok: false, phase, message, step }
}

export function formatResult(r) {
  if (r.ok) return `verify: PASS ${r.detail ?? ''}`.trimEnd()
  const where = r.step === undefined ? '' : ` step index ${r.step}:`
  return `verify: FAIL [${r.phase}]${where} ${r.message}`
}

export function exitCodeFor(r) {
  return r.ok ? 0 : 1
}

/** Collects console/page errors, attributing each to the step shown when it fired. */
export function createErrorCollector(getStep) {
  const errors = []
  return {
    errors,
    onConsole(msg) {
      if (msg.type() === 'error') errors.push({ step: getStep(), message: `console.error: ${msg.text()}` })
    },
    onPageError(err) {
      errors.push({ step: getStep(), message: `uncaught exception: ${err.message}` })
    },
  }
}

export function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', (e) => resolve({ code: 1, out: String(e) }))
    child.on('close', (code) => resolve({ code, out }))
  })
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

export async function startPreview(root, port, log = () => {}) {
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  const exited = new Promise((resolve) => child.once('exit', resolve))
  let dead = false
  exited.then(() => (dead = true))
  const stop = async () => {
    if (dead) return
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      /* already gone */
    }
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {
        /* already gone */
      }
    }, 3000)
    await exited
    clearTimeout(timer)
  }
  for (let i = 0; i < 100; i++) {
    if (dead) break
    try {
      const res = await fetch(previewUrl(port))
      if (res.ok) {
        log(`verify: preview ready at ${previewUrl(port)} (readiness probe)`)
        return { stop }
      }
    } catch {
      /* not ready */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  await stop()
  throw new Error(`preview did not become ready on ${previewUrl(port)}\n${output}`)
}

async function readStep(page) {
  return page.evaluate(() => {
    const text = (sel) => document.querySelector(sel)?.textContent?.trim() ?? ''
    const caption = document.querySelector('[data-presentation-caption]')
    return {
      era: caption?.getAttribute('data-presentation-era') ?? '',
      title: text('[data-presentation-title]'),
      caption: caption?.textContent?.trim() ?? '',
    }
  })
}

/** Steps through one route; returns a failure result or the rendered outline. */
export async function renderRoute(browser, port, slug, log = () => {}) {
  const page = await browser.newPage()
  let current = 0
  const collector = createErrorCollector(() => current)
  page.on('console', collector.onConsole)
  page.on('pageerror', collector.onPageError)
  try {
    log(`verify: opening ${previewUrl(port, `/${slug}`)}`)
    await page.goto(previewUrl(port, `/${slug}`), { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    } catch {
      const first = collector.errors[0]
      return fail('render', first ? first.message : `/${slug} never rendered a presentation`, 0)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    const outline = []
    for (let i = 0; i < count; i++) {
      current = i
      const idx = Number(await page.getAttribute('[data-step-count]', 'data-step-index'))
      if (idx !== i) return fail('transition', `expected step index ${i} but the page reports ${idx} (/${slug})`, i)
      const shown = await readStep(page)
      outline.push(shown)
      log(`verify: /${slug} step ${i + 1}/${count} (index ${i}) "${shown.title}"`)
      await page.waitForTimeout(SETTLE_MS)
      const err = collector.errors.find((e) => e.step === i)
      if (err) return fail('render', `${err.message} (/${slug})`, i)
      if (i < count - 1) {
        current = i + 1 // errors raised while moving to the next step belong to it
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(n),
            i + 1,
            { timeout: STEP_TIMEOUT_MS },
          )
        } catch {
          const err2 = collector.errors[0]
          if (err2) return fail('render', `${err2.message} (/${slug})`, err2.step)
          current = i
          return fail('transition', `step index did not advance from ${i} to ${i + 1} (/${slug})`, i)
        }
      }
    }
    await page.waitForTimeout(SETTLE_MS)
    const late = collector.errors[0]
    if (late) return fail('render', `${late.message} (/${slug})`, late.step)
    return { ok: true, outline, count }
  } finally {
    await page.close()
  }
}

export async function verify({ root = process.cwd(), port, slug, log = () => {} } = {}) {
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  const cfg = pkg.andScene ?? {}

  const build = await run('npm', ['run', 'build'], root)
  if (build.code !== 0) return fail('build', `npm run build failed:\n${build.out.trim()}`)

  const registryPath = ['index.ts', 'index.tsx'].map((n) => path.join(root, 'src', 'presentations', n)).find(existsSync)
  if (!registryPath) return fail('sample', 'src/presentations/index.ts is missing')
  const slugs = registeredSlugs(readFileSync(registryPath, 'utf8'))
  let expectedOutline = null
  if (cfg.reference) {
    if (!slugs.includes(cfg.reference)) {
      return fail('sample', `reference presentation "${cfg.reference}" is not registered in src/presentations/index.ts`)
    }
    const outlinePath = path.join(root, cfg.outline ?? '')
    if (!cfg.outline || !existsSync(outlinePath)) {
      return fail('sample', `reference outline ${cfg.outline ?? '(unset)'} is missing`)
    }
    try {
      expectedOutline = JSON.parse(readFileSync(outlinePath, 'utf8'))
    } catch (e) {
      return fail('sample', `reference outline is malformed: ${e.message}`)
    }
  } else if (slugs.length === 0) {
    return fail('sample', 'no presentations are registered in src/presentations/index.ts')
  }

  const selected = selectTargets({ slugs, reference: cfg.reference, requested: slug })
  if (selected.error) return fail('sample', selected.error)

  const { chromium } = await import('playwright')
  const previewPort = port ?? (await freePort())
  const preview = await startPreview(root, previewPort, log)
  let browser
  try {
    browser = await chromium.launch()
    const { targets } = selected
    let steps = 0
    for (const slug of targets) {
      const r = await renderRoute(browser, previewPort, slug, log)
      if (!r.ok) return r
      steps += r.count
      if (slug === cfg.reference) {
        const problems = compareOutline(expectedOutline, r.outline)
        if (problems.length) return fail('sample', `"${slug}" does not match its outline: ${problems.join('; ')}`)
      }
    }
    return pass(`(build, sample, render: ${targets.length} presentation(s), ${steps} steps)`)
  } catch (e) {
    return fail('render', e instanceof Error ? e.message : String(e))
  } finally {
    await browser?.close().catch(() => {})
    await preview.stop()
  }
}

function parseArgs(argv) {
  const value = (flag) => {
    const i = argv.indexOf(flag)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const port = value('--port')
  return { port: port === undefined ? undefined : Number(port), slug: value('--slug') }
}

async function main() {
  const { port, slug } = parseArgs(process.argv.slice(2))
  const result = await verify({ port, slug, log: console.log }).catch((e) => fail('verify', String(e?.stack ?? e)))
  const line = formatResult(result)
  if (result.ok) console.log(line)
  else console.error(line)
  process.exit(exitCodeFor(result))
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
}
