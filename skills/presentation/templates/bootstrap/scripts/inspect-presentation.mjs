import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [slug, ...args] = process.argv.slice(2)
if (!slug) {
  console.error('Usage: npm run inspect -- <presentation-slug> [--url http://127.0.0.1:4173] [--settle 900]')
  process.exit(2)
}
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
let base = option('--url', 'http://127.0.0.1:4173').replace(/\/$/, '')
const settleMs = Number(option('--settle', '900'))
const outDir = path.join(root, 'artifacts', 'presentation-inspection', slug)
await mkdir(outDir, { recursive: true })
const reservePort = () => new Promise((resolve, reject) => {
  const socket = createServer()
  socket.once('error', reject)
  socket.listen(0, '127.0.0.1', () => {
    const address = socket.address()
    if (!address || typeof address === 'string') return reject(new Error('could not reserve an IPv4 preview port'))
    socket.close((error) => error ? reject(error) : resolve(address.port))
  })
})

const browser = await chromium.launch({ headless: true })
let preview
try {
  if (!args.includes('--url')) {
    const port = await reservePort()
    let startupError
    let startupOutput = ''
    preview = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
    preview.on('error', (error) => { startupError = error })
    preview.stderr.setEncoding('utf8').on('data', (chunk) => { startupOutput += chunk })
    const localBase = `http://127.0.0.1:${port}`
    let ready = false
    for (let attempt = 0; attempt < 60; attempt++) {
      if (startupError || preview.exitCode !== null) throw new Error(`preview failed to start: ${startupError?.message ?? startupOutput}`)
      try { if ((await fetch(localBase)).ok) { ready = true; break } } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    if (!ready) throw new Error(`preview did not become ready at ${localBase}: ${startupOutput}`)
    base = localBase
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const stepRoot = page.locator('[data-step-count]')
  const count = Number(await stepRoot.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`/${slug} did not expose a positive data-step-count`)
  const warnings = []
  for (let index = 0; index < count; index++) {
    if (index) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index)
    }
    await page.waitForTimeout(settleMs)
    const step = await page.locator('[data-step-index]').getAttribute('data-step-index')
    const filename = path.join(outDir, `step-${String(index + 1).padStart(2, '0')}.png`)
    await page.screenshot({ path: filename, fullPage: true })
    const findings = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
      }
      const nodes = [...document.querySelectorAll('main *, [data-presentation]')].filter((element) => visible(element) && element.textContent?.trim() && !element.closest('[data-presentation-allow-overlap]'))
      const overlaps = []
      for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
        if (nodes[a].contains(nodes[b]) || nodes[b].contains(nodes[a])) continue
        const x = nodes[a].getBoundingClientRect(), y = nodes[b].getBoundingClientRect()
        if (Math.min(x.right, y.right) - Math.max(x.left, y.left) > 6 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 6) overlaps.push(`${nodes[a].getAttribute('data-presentation-id') || nodes[a].className || nodes[a].tagName} ↔ ${nodes[b].getAttribute('data-presentation-id') || nodes[b].className || nodes[b].tagName}`)
      }
      const active = [...document.querySelectorAll('[data-presentation-active="true"]')]
      const inactive = [...document.querySelectorAll('[data-presentation-active="false"]')]
      const color = (element) => { const style = getComputedStyle(element); return `${style.color}|${style.backgroundColor}|${style.opacity}|${style.fontWeight}|${style.borderColor}` }
      const indistinct = active.some((item) => inactive.some((other) => color(item) === color(other)))
      const attribution = document.querySelector('[data-presentation-attribution] a')
      const attrStyle = attribution ? getComputedStyle(attribution) : null
      const attrRect = attribution?.getBoundingClientRect()
      const attributionIssue = !attribution || !attrStyle || Number.parseFloat(attrStyle.fontSize) < 11 || (attrStyle.color === 'rgb(0, 0, 238)' && attrStyle.textDecorationLine.includes('underline')) || (attrRect && attrRect.width < 80)
      return { overlaps, indistinct, attributionIssue }
    })
    for (const overlap of findings.overlaps) warnings.push(`step ${Number(step) + 1}: possible overlap ${overlap}`)
    if (findings.indistinct) warnings.push(`step ${Number(step) + 1}: active navigation looks like inactive navigation`)
    if (findings.attributionIssue) warnings.push(`step ${Number(step) + 1}: attribution is missing, browser-default, or undersized; style [data-presentation-attribution]`)
    console.log(`Captured ${filename}`)
  }
  for (const warning of [...new Set(warnings)]) console.warn(`WARNING: ${warning}`)
  console.log(`Inspection complete: ${count} screenshots in ${outDir}`)
} finally {
  await browser.close()
  if (preview && preview.exitCode === null) preview.kill('SIGTERM')
}
