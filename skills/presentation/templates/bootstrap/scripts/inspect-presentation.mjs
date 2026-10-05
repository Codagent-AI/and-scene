import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const slug = process.argv[2]
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error('Usage: npm run inspect -- <presentation-slug> (lowercase letters, numbers, and hyphens)')
}
const root = fileURLToPath(new URL('..', import.meta.url))
const output = `inspection/${slug}`
const settleMs = Number(process.env.PRESENTATION_SETTLE_MS ?? 700)
async function freePort() {
  const probe = createServer()
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve) })
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}
async function stop(server) {
  if (server.exitCode !== null || server.signalCode !== null) return
  const closed = new Promise((resolve) => server.once('close', resolve))
  server.kill('SIGTERM')
  const timeout = setTimeout(() => server.kill('SIGKILL'), 3000)
  await closed
  clearTimeout(timeout)
}
const port = await freePort()
const base = `http://127.0.0.1:${port}`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
let browser
let startupOutput = ''
server.stderr.setEncoding('utf8'); server.stderr.on('data', (chunk) => { startupOutput += chunk })
try {
  await mkdir(output, { recursive: true })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null || server.signalCode !== null) throw new Error(`preview exited before ready: ${startupOutput.trim()}`)
    try { ready = (await fetch(base, { signal: AbortSignal.timeout(1000) })).ok; if (ready) break } catch { /* bounded readiness probe */ }
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${base}: ${startupOutput.trim()}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${base}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const footer = page.locator('[data-step-count]')
  await footer.waitFor()
  const count = Number(await footer.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('presentation has no valid data-step-count')
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(settleMs)
    await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index)
    const file = `${output}/step-${String(index + 1).padStart(2, '0')}.png`
    await page.screenshot({ path: file, fullPage: true })
    const diagnostic = await page.evaluate(() => {
      const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0 }
      const nodes = [...document.querySelectorAll('[data-presentation-node], [data-presentation-caption], [data-presentation-era], [data-presentation-header], [data-presentation-toc], [data-presentation-footer]')]
        .filter((el) => visible(el) && (el.textContent?.trim() || el.hasAttribute('data-presentation-node')) && !el.closest('[data-presentation-allow-overlap]'))
      const overlaps = []
      for (let a = 0; a < nodes.length; a += 1) for (let b = a + 1; b < nodes.length; b += 1) {
        const first = nodes[a], second = nodes[b]
        if (first.contains(second) || second.contains(first)) continue
        const ar = first.getBoundingClientRect(), br = second.getBoundingClientRect()
        if (Math.min(ar.right, br.right) - Math.max(ar.left, br.left) > 4 && Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top) > 4) {
          const name = (el) => el.getAttribute('data-presentation-entity') || el.getAttribute('data-presentation-node') || el.getAttribute('data-presentation-caption') || el.getAttribute('data-presentation-era') || el.getAttribute('aria-label') || el.className
          overlaps.push(`${name(first)} overlaps ${name(second)}`)
        }
      }
      const active = [...document.querySelectorAll('[data-presentation-active="true"]')]
      const indistinct = active.some((el) => {
        const peers = [...(el.parentElement?.querySelectorAll('[data-presentation-active="false"]') ?? [])]
        if (!peers.length) return false
        const a = getComputedStyle(el), b = getComputedStyle(peers[0])
        return a.color === b.color && a.backgroundColor === b.backgroundColor && a.borderColor === b.borderColor && a.fontWeight === b.fontWeight && a.opacity === b.opacity
      })
      const attribution = document.querySelector('[data-presentation-attribution]')
      let attributionIssue = !attribution || !visible(attribution) ? 'missing or invisible' : ''
      if (attribution && visible(attribution)) {
        const s = getComputedStyle(attribution)
        if (Number.parseFloat(s.fontSize) < 11) attributionIssue = 'undersized'
        else if (s.color === 'rgb(0, 0, 238)' || s.color === 'rgb(0, 0, 0)' || s.textDecorationLine.includes('underline') && s.textDecorationStyle === 'solid') attributionIssue = 'browser-default looking'
      }
      return { overlaps, indistinct, attributionIssue }
    })
    for (const issue of diagnostic.overlaps) console.warn(`step ${index + 1}: possible text/chrome overlap: ${issue}`)
    if (diagnostic.indistinct) console.warn(`step ${index + 1}: active progress or table-of-contents state may be visually indistinct`)
    if (diagnostic.attributionIssue) console.warn(`step ${index + 1}: ${diagnostic.attributionIssue} attribution; style [data-presentation-attribution]`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, index + 1)
    }
  }
  console.log(`Captured ${count} settled screenshots at ${output}/ (settle ${settleMs} ms).`)
} finally {
  await browser?.close()
  await stop(server)
}
