import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const host = '127.0.0.1', port = Number(process.env.PREVIEW_PORT ?? 4173), url = `http://${host}:${port}`
let preview, browser, exited = false
try {
  try { await fetch(url, { signal: AbortSignal.timeout(150) }); throw new Error(`Port ${port} is already serving content at ${url}`) } catch (error) { if (error.message?.startsWith('Port ')) throw error }
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  preview.on('exit', () => { exited = true })
  let ready = false
  for (let i = 0; i < 60 && !exited; i++) { try { if ((await fetch(url)).ok) { ready = true; break } } catch {} await delay(200) }
  if (!ready) throw new Error(`Preview did not become ready at ${url}; run npm run build first`)
  await mkdir('inspection', { recursive: true })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${url}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]'); await root.waitFor()
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`Invalid data-step-count for ${slug}`)
  for (let index = 0; index < count; index++) {
    if (Number(await root.getAttribute('data-step-index')) !== index) throw new Error(`Expected step ${index + 1}, observed another step`)
    await page.waitForTimeout(Number(process.env.INSPECT_SETTLE_MS ?? 900))
    await page.screenshot({ path: `inspection/${slug}-${String(index + 1).padStart(2, '0')}.png` })
    const warnings = await page.evaluate(() => {
      const result = []
      const activeSelector = '[data-presentation-progress-item][data-active="true"], [data-presentation-toc-item][data-active="true"]'
      for (const active of document.querySelectorAll(activeSelector)) {
        const inactive = document.querySelector(active.matches('[data-presentation-progress-item]') ? '[data-presentation-progress-item][data-active="false"]' : '[data-presentation-toc-item][data-active="false"]')
        if (!inactive) continue
        const style = element => getComputedStyle(element)
        const keys = ['color', 'backgroundColor', 'opacity', 'borderColor', 'fontWeight', 'textDecorationLine']
        if (keys.every(key => style(active)[key] === style(inactive)[key]) && Math.abs(active.getBoundingClientRect().width - inactive.getBoundingClientRect().width) < 2) result.push('active progress or table-of-contents state may be visually indistinct')
      }
      const candidates = []
      const walker = document.createTreeWalker(document.querySelector('[data-presentation]'), NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const text = walker.currentNode
        const owner = text.parentElement
        if (!text.textContent.trim() || !owner || owner.closest('[data-presentation-allow-overlap]')) continue
        const style = getComputedStyle(owner)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue
        const range = document.createRange()
        range.selectNodeContents(text)
        for (const bounds of range.getClientRects()) if (bounds.width > 1 && bounds.height > 1) {
          const marker = owner.closest('[data-entity-id], [data-presentation-progress-item], [data-presentation-toc-item], [data-presentation-attribution]')
          const name = marker?.getAttribute('data-entity-id') || marker?.getAttribute('aria-label') || owner.className.baseVal || owner.className || owner.tagName.toLowerCase()
          candidates.push({ bounds, name, owner })
        }
      }
      for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
        const { bounds: a, owner: ownerA } = candidates[i], { bounds: b, owner: ownerB } = candidates[j]
        if (ownerA === ownerB || ownerA.contains(ownerB) || ownerB.contains(ownerA)) continue
        if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1) result.push(`visible text overlap: ${candidates[i].name} ↔ ${candidates[j].name}; use data-presentation-allow-overlap only for intentional readable overlap`)
      }
      const credit = document.querySelector('[data-presentation-attribution]')
      if (!credit || !credit.textContent.trim()) result.push('missing attribution; style [data-presentation-attribution]')
      else {
        const link = credit.querySelector('a'), target = link ?? credit, style = getComputedStyle(target)
        if (credit.getBoundingClientRect().width < 100 || parseFloat(style.fontSize) < 12) result.push('attribution may be undersized; style [data-presentation-attribution]')
        if (link && ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color)) result.push('attribution may use browser-default link styling; style [data-presentation-attribution]')
      }
      return [...new Set(result)]
    })
    for (const warning of warnings) console.warn(`WARN step ${index + 1}: ${warning}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(expected => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  console.log(`Captured ${count} settled steps in inspection/`)
} finally {
  await browser?.close()
  if (preview && !exited) { preview.kill('SIGTERM'); await Promise.race([new Promise(resolve => preview.once('exit', resolve)), delay(3000)]) }
}
