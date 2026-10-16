#!/usr/bin/env node
// Production verification: build, sample check, preview, real-browser render.
// Resolves everything from the project root (parent of this script's directory).
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const HOST = '127.0.0.1'
const require = createRequire(path.join(ROOT, 'package.json'))

export class PhaseError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

export function loadConfig(root = ROOT) {
  const file = path.join(root, 'scripts', 'verification.config.json')
  let raw
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    throw new PhaseError('config', `cannot read ${file}: ${e.message}`)
  }
  return parseConfig(raw)
}

export function parseConfig(raw) {
  const list = Array.isArray(raw) ? raw : raw && raw.presentations
  if (!Array.isArray(list) || list.length === 0) {
    throw new PhaseError('config', 'verification.config.json needs a non-empty "presentations" array')
  }
  for (const p of list) {
    if (!p || typeof p.slug !== 'string' || !p.slug) throw new PhaseError('config', 'every presentation needs a string "slug"')
    if (p.expectedSteps !== undefined) {
      const ok = Array.isArray(p.expectedSteps) && p.expectedSteps.every((s) => s && typeof s.title === 'string' && typeof s.caption === 'string')
      if (!ok) throw new PhaseError('config', `"expectedSteps" for ${p.slug} must be {title, caption}[]`)
    }
  }
  return list
}

export function selectEntries(entries, slug) {
  if (!slug) return entries
  const hit = entries.filter((e) => e.slug === slug)
  if (hit.length === 0) {
    throw new PhaseError('config', `slug "${slug}" is not in scripts/verification.config.json (known: ${entries.map((e) => e.slug).join(', ')})`)
  }
  return hit
}

/** Registry slugs declared in src/presentations/index.ts. */
export function registeredSlugs(root = ROOT) {
  const src = fs.readFileSync(path.join(root, 'src', 'presentations', 'index.ts'), 'utf8')
  return [...src.matchAll(/slug:\s*(['"`])([^'"`]+)\1/g)].map((m) => m[2])
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    return d.isDirectory() ? walk(p) : [p]
  }).sort()
}

/** Pure: titles/captions must occur in `source` as string literals, in order. */
export function checkStepsInSource(source, expectedSteps) {
  let pos = 0
  for (let i = 0; i < expectedSteps.length; i++) {
    for (const key of ['title', 'caption']) {
      const text = expectedSteps[i][key]
      const found = literalIndex(source, text, pos)
      if (found < 0) {
        const anywhere = literalIndex(source, text, 0) >= 0
        return `step ${i + 1} ${key} ${JSON.stringify(text)} ${anywhere ? 'is out of order' : 'was not found'}`
      }
      pos = found + 1
    }
  }
  return null
}

function literalIndex(source, text, from) {
  const variants = new Set([text, text.replace(/'/g, "\\'"), text.replace(/"/g, '\\"')])
  let best = -1
  for (const v of variants) {
    for (const q of ["'", '"', '`']) {
      const i = source.indexOf(q + v + q, from)
      if (i >= 0 && (best < 0 || i < best)) best = i
    }
  }
  return best
}

export function checkSample(entry, root = ROOT) {
  if (!registeredSlugs(root).includes(entry.slug)) {
    throw new PhaseError('sample', `"${entry.slug}" is not registered in src/presentations/index.ts`)
  }
  if (!entry.expectedSteps) return
  const dir = path.join(root, 'src', 'presentations', entry.slug)
  if (!fs.existsSync(dir)) throw new PhaseError('sample', `presentation folder src/presentations/${entry.slug}/ is missing`)
  const source = walk(dir).filter((f) => /\.(tsx?|jsx?)$/.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n')
  const problem = checkStepsInSource(source, entry.expectedSteps)
  if (problem) throw new PhaseError('sample', `${entry.slug}: ${problem}`)
}

function ROOT_OF_VITE() {
  return path.join(ROOT, 'node_modules')
}

function viteBin() {
  const dir = path.join(ROOT_OF_VITE(), 'vite')
  return path.join(dir, JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).bin.vite)
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    s.once('error', reject)
    s.listen(0, HOST, () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
  })
}

export function runBuild(root = ROOT) {
  const r = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' })
  if (r.status !== 0) {
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-25).join('\n')
    throw new PhaseError('build', `npm run build exited with ${r.status}\n${out}`)
  }
}

const live = new Set()
let handlersInstalled = false
function killAll() {
  for (const c of live) {
    try {
      process.kill(-c.pid, 'SIGKILL')
    } catch {
      try { c.kill('SIGKILL') } catch { /* already gone */ }
    }
  }
  live.clear()
}
function installHandlers() {
  if (handlersInstalled) return
  handlersInstalled = true
  process.on('exit', killAll)
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(sig, () => {
      killAll()
      process.exit(130)
    })
  }
}

/** Start `vite preview` on 127.0.0.1 and wait until it answers. */
export async function startPreview(root = ROOT, port) {
  installHandlers()
  port ??= await freePort()
  const child = spawn(process.execPath, [viteBin(), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  live.add(child)
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  let exited = false
  child.on('exit', () => (exited = true))
  const url = `http://${HOST}:${port}`
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    if (exited) break
    try {
      const res = await fetch(`${url}/`)
      if (res.ok) {
        return { url, port, stop: () => stopChild(child) }
      }
    } catch { /* not ready */ }
    await new Promise((r) => setTimeout(r, 150))
  }
  await stopChild(child)
  throw new PhaseError('preview', `vite preview did not become ready on ${url}\n${log.trim()}`)
}

async function stopChild(child) {
  if (!live.has(child)) return
  const done = new Promise((resolve) => child.once('exit', resolve))
  try { process.kill(-child.pid, 'SIGTERM') } catch { try { child.kill('SIGTERM') } catch { /* gone */ } }
  const timer = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL') } catch { /* gone */ } }, 3000)
  if (child.exitCode === null && child.signalCode === null) await done
  clearTimeout(timer)
  live.delete(child)
}

export function loadPlaywright() {
  try {
    return require('playwright')
  } catch {
    throw new PhaseError('render', 'playwright is not installed in this project (npm install; npx playwright install chromium)')
  }
}

export async function launchBrowser() {
  const { chromium } = loadPlaywright()
  try {
    return await chromium.launch()
  } catch (e) {
    throw new PhaseError('render', `could not launch Chromium (run: npx playwright install chromium)\n${e.message}`)
  }
}

export async function renderPresentation(browser, baseUrl, slug) {
  const page = await browser.newPage()
  const errors = []
  let current = 0
  const record = (kind, text) => errors.push({ step: current, text: `${kind}: ${text}` })
  page.on('console', (m) => { if (m.type() === 'error') record('console.error', m.text()) })
  page.on('pageerror', (e) => record('pageerror', e.message))
  try {
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'load' })
    const chrome = page.locator('[data-presentation-chrome]')
    try {
      await chrome.waitFor({ state: 'attached', timeout: 10000 })
    } catch {
      throw new PhaseError('render', `${slug}: presentation chrome did not render at ${baseUrl}/${slug}${errors.length ? ` (${errors[0].text})` : ''}`, 1)
    }
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new PhaseError('render', `${slug}: invalid data-step-count`, 1)
    const readIndex = async () => Number(await chrome.getAttribute('data-step-index'))
    if ((await readIndex()) !== 0) throw new PhaseError('render', `${slug}: presentation does not start at step index 0`, 1)
    for (let i = 0; i < count; i++) {
      current = i + 1
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            ([want]) => document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index') === String(want),
            [i],
            { timeout: 3000 },
          )
        } catch {
          throw new PhaseError('render', `${slug}: transition failed — data-step-index did not advance to ${i} (got ${await readIndex()})`, current)
        }
      }
      await page.waitForTimeout(250)
      if (errors.length) break
    }
    if (errors.length) {
      const e = errors[0]
      throw new PhaseError('render', `${slug}: ${e.text}`, e.step)
    }
    return count
  } finally {
    await page.close()
  }
}

export function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--slug') out.slug = argv[++i]
    else if (argv[i].startsWith('--slug=')) out.slug = argv[i].slice(7)
    else throw new PhaseError('config', `unknown argument ${argv[i]}`)
  }
  if (argv.includes('--slug') && !out.slug) throw new PhaseError('config', '--slug needs a value')
  return out
}

async function main() {
  const phase = (name, msg) => console.log(`[verify] ${name}: ${msg}`)
  let preview
  let browser
  try {
    const args = parseArgs(process.argv.slice(2))
    const all = loadConfig()
    const entries = selectEntries(all, args.slug)
    if (args.slug && !registeredSlugs().includes(args.slug)) {
      throw new PhaseError('config', `slug "${args.slug}" is not registered in src/presentations/index.ts`)
    }
    phase('build', 'running npm run build')
    runBuild()
    phase('build', 'ok')
    for (const e of entries) checkSample(e)
    phase('sample', `ok (${entries.map((e) => e.slug).join(', ')})`)
    preview = await startPreview()
    phase('preview', `ok (${preview.url})`)
    browser = await launchBrowser()
    for (const e of entries) {
      const n = await renderPresentation(browser, preview.url, e.slug)
      if (e.expectedSteps && e.expectedSteps.length !== n) {
        throw new PhaseError('render', `${e.slug}: expected ${e.expectedSteps.length} steps, rendered ${n}`)
      }
      phase('render', `ok ${e.slug} (${n} steps at ${preview.url}/${e.slug})`)
    }
    console.log('PASS verify: build, sample, preview, render')
    return 0
  } catch (err) {
    if (err instanceof PhaseError) {
      console.error(`FAIL verify [${err.phase}]${err.step ? ` step ${err.step}` : ''}: ${err.message}`)
    } else {
      console.error(`FAIL verify [unexpected]: ${err?.stack ?? err}`)
    }
    return 1
  } finally {
    if (browser) await browser.close().catch(() => {})
    if (preview) await preview.stop()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => process.exit(code))
}
