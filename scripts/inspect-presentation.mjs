#!/usr/bin/env node
// Per-step screenshots + advisory visual diagnostics for one registered presentation.
//
// Usage: node scripts/inspect-presentation.mjs <slug> [--root <dir>] [--viewport WxH]
//          [--settle <ms>] [--out <dir>] [--skip-build]
// Screenshots go to <root>/.inspect/<slug>/step-NN.png (NN is one-based).
// Advisory warnings never affect the exit code; only operational errors do.
import { spawn } from 'node:child_process'
import { mkdirSync, realpathSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HOST = '127.0.0.1'
const DEFAULT_SETTLE_MS = 1500 // layout move + newcomer enter + scene fade, with margin
const MIN_ATTRIBUTION_PX = 11

class OperationalError extends Error {}

const stoppers = new Set()
process.on('exit', () => stoppers.forEach((stop) => stop()))
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130))

function parseArgs(argv, env) {
  const opts = {
    slug: undefined,
    root: path.resolve(env.INSPECT_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), '..')),
    viewport: { width: 1280, height: 720 },
    settle: DEFAULT_SETTLE_MS,
    out: undefined,
    build: true,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--root') opts.root = path.resolve(argv[++i])
    else if (a === '--viewport') {
      const m = /^(\d+)x(\d+)$/.exec(argv[++i] ?? '')
      if (!m) throw new OperationalError('--viewport expects WxH, e.g. 390x844')
      opts.viewport = { width: Number(m[1]), height: Number(m[2]) }
    } else if (a === '--narrow') opts.viewport = { width: 390, height: 844 }
    else if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--out') opts.out = path.resolve(argv[++i])
    else if (a === '--skip-build') opts.build = false
    else if (a.startsWith('--')) throw new OperationalError(`unknown option: ${a}`)
    else opts.slug = a
  }
  if (!opts.slug) throw new OperationalError('usage: npm run inspect -- <slug> [--viewport WxH] [--settle ms] [--root dir]')
  if (!Number.isFinite(opts.settle) || opts.settle < 0) throw new OperationalError('--settle expects a non-negative number of ms')
  opts.out ??= path.join(opts.root, '.inspect', opts.slug)
  return opts
}

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new OperationalError(`${cmd} ${args.join(' ')} failed (${code})\n${out.trim().split('\n').slice(-25).join('\n')}`)),
    )
  })
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.on('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

async function startPreview(root) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  let exited = false
  child.on('exit', () => (exited = true))
  const stop = () => {
    if (exited) return
    try { process.kill(-child.pid, 'SIGKILL') } catch { /* already gone */ }
  }
  stoppers.add(stop)
  const origin = `http://${HOST}:${port}`
  const deadline = Date.now() + 30000
  for (;;) {
    if (exited) throw new OperationalError(`vite preview exited early\n${log.trim()}`)
    try {
      if ((await fetch(`${origin}/`)).ok) break
    } catch { /* not ready */ }
    if (Date.now() > deadline) { stop(); throw new OperationalError(`vite preview not ready at ${origin}\n${log.trim()}`) }
    await new Promise((r) => setTimeout(r, 150))
  }
  return { origin, stop }
}

/** Runs in the page. Returns advisory findings for the current step. */
function diagnose({ minAttributionPx }) {
  const cs = (el) => getComputedStyle(el)
  const effectiveOpacity = (el) => {
    let o = 1
    for (let n = el; n; n = n.parentElement) o *= Number(cs(n).opacity)
    return o
  }
  const visible = (el, rect) => {
    const s = cs(el)
    return s.display !== 'none' && s.visibility !== 'hidden' && effectiveOpacity(el) > 0.05 && rect.width > 1 && rect.height > 1
  }
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && !['data-presentation-active'].includes(a.name))
    const id = el.getAttribute('data-presentation-id')
    const text = (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `${hook ? `[${hook.name}${id ? `=${id}` : ''}]` : el.tagName.toLowerCase()}${text ? ` "${text}"` : ''}`
  }
  const textRect = (el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    const r = range.getBoundingClientRect()
    return r.width && r.height ? r : el.getBoundingClientRect()
  }

  // ---- (a) overlapping visible text/chrome elements ----
  const chromeSel = [
    'brand', 'marker', 'title', 'mode-toggle', 'step-title', 'caption', 'prev', 'next', 'progress-dot', 'toc-entry', 'attribution',
  ].map((h) => `[data-presentation-${h}]`).join(',')
  const candidates = new Set(document.querySelectorAll(chromeSel))
  for (const el of document.querySelectorAll('[data-presentation-canvas] *')) {
    if (el.closest('svg')) continue
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (own) candidates.add(el)
  }
  const items = []
  for (const el of candidates) {
    if (el.closest('[data-presentation-allow-overlap]')) continue
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || el.matches(chromeSel)
    const rect = hasText && el.textContent.trim() ? textRect(el) : el.getBoundingClientRect()
    if (visible(el, rect)) items.push({ el, rect })
  }
  const overlaps = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (w > 2 && h > 2) overlaps.push(`${describe(a.el)} overlaps ${describe(b.el)}`)
    }
  }

  // ---- (b) active vs inactive chrome ----
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number)
  const colorDelta = (x, y) => {
    const a = parse(x), b = parse(y)
    const alpha = (v) => (v.length > 3 ? v[3] : 1)
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(alpha(a) - alpha(b)) * 255
  }
  const styleDiff = (a, b) => {
    const A = cs(a), B = cs(b)
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
    const diffs = []
    for (const p of ['color', 'backgroundColor', 'borderTopColor', 'borderLeftColor']) if (colorDelta(A[p], B[p]) >= 40) diffs.push(p)
    if (Math.abs(ra.width - rb.width) >= 2 || Math.abs(ra.height - rb.height) >= 2) diffs.push('size')
    if (A.fontWeight !== B.fontWeight) diffs.push('fontWeight')
    if (Math.abs(Number(A.opacity) - Number(B.opacity)) >= 0.2) diffs.push('opacity')
    if (A.boxShadow !== B.boxShadow) diffs.push('boxShadow')
    if (A.textDecorationLine !== B.textDecorationLine) diffs.push('textDecoration')
    if (A.transform !== B.transform) diffs.push('transform')
    return diffs
  }
  const indistinct = []
  for (const [hook, label] of [['progress-dot', 'active progress indicator'], ['toc-entry', 'active table-of-contents entry']]) {
    const all = [...document.querySelectorAll(`[data-presentation-${hook}]`)].filter((el) => visible(el, el.getBoundingClientRect()))
    const active = all.filter((el) => el.getAttribute('data-presentation-active') === 'true')
    const inactive = all.filter((el) => !active.includes(el))
    if (!active.length || !inactive.length) continue
    const same = inactive.filter((el) => styleDiff(active[0], el).length === 0)
    if (same.length) {
      indistinct.push(`${label} [data-presentation-${hook}] is visually indistinguishable from ${same.length} inactive ${hook === 'toc-entry' ? 'entries' : 'indicators'}; style [data-presentation-active="true"]`)
    }
  }

  // ---- (c) attribution polish ----
  const attribution = []
  const link = document.querySelector('[data-presentation-attribution]')
  if (link && visible(link, link.getBoundingClientRect())) {
    const s = cs(link), p = cs(link.parentElement)
    const px = parseFloat(s.fontSize)
    const problems = []
    if (px < minAttributionPx) problems.push(`too small (${px}px < ${minAttributionPx}px)`)
    const defaultBlue = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(158, 158, 158)'].includes(s.color) && s.textDecorationLine === 'underline'
    const inheritsAll = s.fontSize === p.fontSize && s.fontFamily === p.fontFamily && s.color === p.color && s.textDecorationLine === 'underline'
    if (defaultBlue || inheritsAll) problems.push('browser-default link styling')
    if (problems.length) attribution.push(`attribution link is ${problems.join(' and ')}; style it with the [data-presentation-attribution] hook`)
  }

  return { overlaps: [...new Set(overlaps)], indistinct, attribution }
}

export async function inspect(opts) {
  const { chromium } = await import('playwright')
  if (opts.build) await run('npm', ['run', 'build'], opts.root)
  mkdirSync(opts.out, { recursive: true })
  const preview = await startPreview(opts.root)
  let browser
  const warnings = []
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: opts.viewport })
    const url = `${preview.origin}/${opts.slug}`
    await page.goto(url, { waitUntil: 'load' })
    const root$ = page.locator('[data-presentation-root]')
    try {
      await root$.waitFor({ timeout: 10000 })
    } catch {
      throw new OperationalError(`route not found or failed to render: ${url}`)
    }
    const count = Number(await root$.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new OperationalError(`unreadable data-step-count at ${url}`)
    console.log(`inspecting ${opts.slug}: ${count} steps at ${opts.viewport.width}x${opts.viewport.height}, settle ${opts.settle}ms -> ${opts.out}`)
    for (let i = 0; i < count; i++) {
      await page.waitForTimeout(opts.settle) // let layout + enter transitions finish before capture
      const n = String(i + 1).padStart(2, '0')
      await page.screenshot({ path: path.join(opts.out, `step-${n}.png`) })
      const found = await page.evaluate(diagnose, { minAttributionPx: MIN_ATTRIBUTION_PX })
      for (const msg of found.overlaps) warnings.push(`WARN step ${n} [overlap] ${msg}`)
      for (const msg of found.indistinct) warnings.push(`WARN step ${n} [active-chrome] ${msg}`)
      for (const msg of found.attribution) warnings.push(`WARN step ${n} [attribution] ${msg}`)
      console.log(`captured step-${n}.png`)
      if (i < count - 1) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (k) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(k),
            i + 1,
            { timeout: 3000 },
          )
        } catch {
          throw new OperationalError(`step ${n}: ArrowRight did not advance data-step-index`)
        }
      }
    }
    warnings.forEach((w) => console.log(w))
    console.log(`done: ${count} screenshots, ${warnings.length} advisory warning(s)`)
    return 0
  } finally {
    await browser?.close().catch(() => {})
    preview.stop()
  }
}

function isEntryPoint() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (process.argv[1] && isEntryPoint()) {
  try {
    process.exit(await inspect(parseArgs(process.argv.slice(2), process.env)))
  } catch (e) {
    console.error(`inspect failed: ${e instanceof OperationalError ? e.message : e?.stack || e}`)
    process.exit(1)
  }
}
