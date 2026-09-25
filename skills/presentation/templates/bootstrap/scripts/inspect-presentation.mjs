import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vite = path.join(project, 'node_modules/vite/bin/vite.js')
function launchPreview() {
  const child = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '0', '--strictPort'], { cwd: project, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  let stderr = ''
  const exited = new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })))
  const ready = new Promise((resolve, reject) => {
    let settled = false
    child.stdout.setEncoding('utf8').on('data', (chunk) => {
      output += chunk
      const match = output.match(/Local:\s+(https?:\/\/127\.0\.0\.1:\d+)/)
      if (match && !settled) { settled = true; resolve(match[1]) }
    })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk })
    child.once('error', (error) => { if (!settled) { settled = true; reject(new Error(`Preview failed to start: ${error.message}`)) } })
    child.once('exit', (code, signal) => {
      if (!settled) { settled = true; reject(new Error(`Preview exited before listening (code ${code}, signal ${signal})${stderr ? `: ${stderr.trim()}` : ''}`)) }
    })
  })
  return { child, exited, ready }
}
let server, serverExited
let browser
try {
  const preview = launchPreview()
  server = preview.child
  serverExited = preview.exited
  const url = await preview.ready
  let ready = false
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error(`Preview exited before readiness (code ${server.exitCode})`)
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`Spawned preview did not respond at ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`${url}/${encodeURIComponent(slug)}`)
  await page.locator('[data-step-count]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  const output = path.join(project, 'artifacts/presentation-inspection', slug)
  await mkdir(output, { recursive: true })
  for (let index = 0; index < count; index++) {
    await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index)
    await page.waitForTimeout(900)
    const warnings = await page.evaluate(() => {
      const visible = (el) => { const rect = el.getBoundingClientRect(); const style = getComputedStyle(el); return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' }
      const active = [...document.querySelectorAll('[data-presentation-progress-item], [data-presentation-toc-item]')].filter((el) => visible(el) && el.getAttribute('data-presentation-active') === 'true')
      const weakActive = active.some((el) => {
        const peers = [...(el.parentElement?.querySelectorAll('[data-presentation-progress-item], [data-presentation-toc-item]') ?? [])].filter((peer) => peer !== el && visible(peer))
        const a = getComputedStyle(el)
        const visiblyMarked = peers.some((peer) => {
          const b = getComputedStyle(peer)
          return a.color !== b.color || a.backgroundColor !== b.backgroundColor || a.borderColor !== b.borderColor || Number(a.fontWeight) >= Number(b.fontWeight) + 100 || (a.outlineStyle !== 'none' && parseFloat(a.outlineWidth) > 0) || a.boxShadow !== 'none'
        })
        return peers.length === 0 || !visiblyMarked
      })
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attributionStyle = attribution && getComputedStyle(attribution)
      const attributionLink = attribution?.querySelector('a')
      const linkStyle = attributionLink && getComputedStyle(attributionLink)
      const weakAttribution = !attribution || !attributionLink || !attributionStyle || !linkStyle || parseFloat(attributionStyle.fontSize) < 12 || linkStyle.textDecorationLine === 'underline' || linkStyle.color === 'rgb(0, 0, 238)'
      const candidates = [...document.querySelectorAll('[data-presentation-caption], [data-presentation-title], [data-presentation-node], [data-presentation-attribution], [data-presentation-progress], [data-presentation-toc]')]
      const describe = (el) => el.hasAttribute('data-presentation-node') ? `${el.getAttribute('data-presentation-node')}.${typeof el.className === 'string' ? el.className : ''}` : ['data-presentation-caption', 'data-presentation-title', 'data-presentation-attribution', 'data-presentation-progress', 'data-presentation-toc'].find((name) => el.hasAttribute(name)) ?? el.className ?? el.tagName.toLowerCase()
      const overlaps = candidates.filter(visible).flatMap((a, i, all) => all.slice(i + 1).flatMap((b) => {
        if (a.closest('[data-allow-overlap]') || b.closest('[data-allow-overlap]')) return []
        const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
        return x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top ? [`${describe(a)} ↔ ${describe(b)}`] : []
      })).filter(Boolean)
      return { weakActive, weakAttribution, overlaps }
    })
    for (const pair of warnings.overlaps) console.warn(`WARN step ${index + 1}: possible unmarked visible text/chrome overlap: ${pair}`)
    if (warnings.weakActive) console.warn(`WARN step ${index + 1}: active progress or contents state may be indistinct`)
    if (warnings.weakAttribution) console.warn(`WARN step ${index + 1}: attribution is missing, browser-default, or undersized; style [data-presentation-attribution]`)
    await page.screenshot({ path: path.join(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    if (index + 1 < count) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900) }
  }
  console.log(`Captured ${count} settled step screenshots in ${output}`)
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally {
  await browser?.close()
  if (server && serverExited && server.exitCode === null && server.signalCode === null) {
    server.kill('SIGTERM')
    const stopped = await Promise.race([serverExited.then(() => true), delay(3000).then(() => false)])
    if (!stopped) { server.kill('SIGKILL'); await serverExited }
  }
}
