#!/usr/bin/env node
// Captures one settled screenshot per step of a registered presentation from a production
// preview and prints advisory visual-quality warnings. Usage:
//   npm run inspect -- <slug> [--narrow] [--out <dir>] [--settle <ms>]
// Env: INSPECT_ROOT (project root, default: parent of scripts/), INSPECT_SKIP_BUILD.
// Warnings are advisory (exit 0). Only operational failures (build, preview, navigation) exit non-zero.
import { spawn, spawnSync } from 'node:child_process'
import { mkdir, readdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  DESKTOP_VIEWPORT,
  NARROW_VIEWPORT,
  SETTLE_MS,
  parseArgs,
  collectOverlapItems,
  settle,
  stepFileName,
  stepWarnings,
} from './lib/inspect-helpers.mjs'

const HOST = '127.0.0.1'
const STEP_ADVANCE_TIMEOUT_MS = 10_000
const PREVIEW_START_TIMEOUT_MS = 30_000

const log = (msg) => console.log(`[inspect] ${msg}`)

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

async function startPreview(root, port, onSpawn) {
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  onSpawn?.(child)
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  const exited = new Promise((resolve) => child.once('exit', resolve))
  child.exited = exited
  const deadline = Date.now() + PREVIEW_START_TIMEOUT_MS
  for (;;) {
    if (child.exitCode !== null) throw new Error(`preview exited early:\n${output}`)
    try {
      const res = await fetch(`http://${HOST}:${port}/`)
      if (res.ok) return child
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      await stopPreview(child)
      throw new Error(`preview did not start within ${PREVIEW_START_TIMEOUT_MS}ms:\n${output}`)
    }
    await new Promise((r) => setTimeout(r, 150))
  }
}

async function stopPreview(child) {
  if (!child || child.exitCode !== null) return
  child.kill('SIGTERM')
  const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
  await child.exited
  clearTimeout(timer)
}

async function loadPlaywright(root) {
  try {
    const mod = await import(pathToFileURL(createRequire(path.join(root, 'package.json')).resolve('playwright')).href)
    return mod.chromium ? mod : mod.default
  } catch {
    const mod = await import('playwright')
    return mod.chromium ? mod : mod.default
  }
}

/** Runs inside the page. Must stay self-contained (serialized by Playwright). */
function collectSnapshot() {
  const styleOf = (el) => {
    const cs = getComputedStyle(el)
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((s) => `${cs[`border${s}Style`]} ${cs[`border${s}Width`]} ${cs[`border${s}Color`]}`)
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      border: sides.join(' | '),
      opacity: cs.opacity,
      fontWeight: cs.fontWeight,
      textDecoration: cs.textDecoration,
    }
  }
  const active = []
  for (const kind of ['progress-item', 'toc-item']) {
    const sel = `[data-presentation-${kind}]`
    const items = Array.from(document.querySelectorAll(sel))
    const current = items.find((el) => el.getAttribute('data-presentation-active') === 'true' && el.getAttribute('aria-current') === 'step')
    const container = current?.closest('nav') ?? document
    const inactive = Array.from(container.querySelectorAll(sel)).find((el) => el !== current && el.getAttribute('data-presentation-active') !== 'true')
    if (current && inactive) active.push({ chrome: sel, active: styleOf(current), inactive: styleOf(inactive) })
  }

  let attribution = null
  const link = document.querySelector('[data-presentation-attribution]')
  if (link) {
    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden'
    document.body.appendChild(frame)
    const doc = frame.contentDocument
    const a = doc.createElement('a')
    a.href = 'https://example.invalid/'
    a.textContent = 'x'
    doc.body.appendChild(a)
    const d = frame.contentWindow.getComputedStyle(a)
    const defaults = { color: d.color, fontFamily: d.fontFamily, textDecoration: d.textDecoration }
    frame.remove()
    const cs = getComputedStyle(link)
    attribution = {
      fontSize: parseFloat(cs.fontSize),
      color: cs.color,
      fontFamily: cs.fontFamily,
      textDecoration: cs.textDecoration,
      defaults,
    }
  }
  return { active, attribution }
}

async function run() {
  const opts = parseArgs(process.argv.slice(2))
  const root = path.resolve(process.env.INSPECT_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'))
  const settleMs = opts.settle ?? SETTLE_MS
  const outDir = path.resolve(opts.out ?? path.join(root, '.inspection', opts.slug))
  const viewport = opts.narrow ? NARROW_VIEWPORT : DESKTOP_VIEWPORT

  if (!process.env.INSPECT_SKIP_BUILD) {
    log('building production bundle (npm run build)')
    const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
    if (build.status !== 0) throw new Error('production build failed')
  }

  const port = await freePort()
  let preview
  let browser
  const cleanup = async () => {
    if (browser) await browser.close().catch(() => {})
    await stopPreview(preview)
  }
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, () => cleanup().finally(() => process.exit(130)))
  }
  try {
    preview = await startPreview(root, port, (child) => (preview = child))
    const { chromium } = await loadPlaywright(root)
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport })
    const consoleErrors = []
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
    page.on('pageerror', (e) => consoleErrors.push(String(e)))
    const url = `http://${HOST}:${port}/${opts.slug}`
    log(`preview ${url}`)
    await page.goto(url)
    try {
      await page.waitForSelector('[data-presentation-root][data-step-count]', { timeout: STEP_ADVANCE_TIMEOUT_MS })
    } catch {
      throw new Error(`no presentation rendered at ${url} (is "${opts.slug}" registered?)`)
    }
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    await mkdir(outDir, { recursive: true })
    for (const f of await readdir(outDir)) if (/^step-\d+\.png$/.test(f)) await rm(path.join(outDir, f))
    log(`${opts.slug}: ${count} steps, viewport ${viewport.width}x${viewport.height}, settle ${settleMs}ms, out ${outDir}`)

    let warnings = 0
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
            i,
            { timeout: STEP_ADVANCE_TIMEOUT_MS },
          )
        } catch {
          throw new Error(`step did not advance to index ${i}`)
        }
      }
      await settle(settleMs)
      const file = path.join(outDir, stepFileName(i))
      await page.screenshot({ path: file })
      log(`step=${i + 1} screenshot ${file}`)
      const lines = stepWarnings(i + 1, {
        ...(await page.evaluate(collectSnapshot)),
        overlapItems: await page.evaluate(collectOverlapItems),
      })
      lines.forEach((l) => console.log(l))
      warnings += lines.length
    }
    for (const e of consoleErrors) console.log(`[inspect] WARN console-error: ${e}`)
    log(`done: ${count} screenshots, ${warnings} advisory warning(s) (advisory only; not a pass/fail gate)`)
  } finally {
    await cleanup()
  }
}

run().then(
  () => process.exit(0),
  (err) => {
    console.error(`[inspect] ERROR ${err instanceof Error ? err.message : err}`)
    process.exit(1)
  },
)
