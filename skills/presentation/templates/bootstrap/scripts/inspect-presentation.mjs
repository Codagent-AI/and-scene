import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const output = `artifacts/inspection/${slug}`
await mkdir(output, { recursive: true })
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch('http://127.0.0.1:4174/')).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('Preview did not become ready on 127.0.0.1:4174; build the app first.')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`http://127.0.0.1:4174/${slug}`)
  await page.locator('[data-step-count]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('[data-presentation] *, [data-presentation-attribution]')].filter((el) => {
        const r = el.getBoundingClientRect(), s = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && el.children.length === 0 && el.textContent?.trim()
      })
      const collisions = []
      for (let a = 0; a < visible.length; a++) for (let b = a + 1; b < visible.length; b++) {
        const x = visible[a].getBoundingClientRect(), y = visible[b].getBoundingClientRect()
        if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top && !visible[a].closest('[data-allow-overlap]') && !visible[b].closest('[data-allow-overlap]')) collisions.push(`${visible[a].textContent.trim()} / ${visible[b].textContent.trim()}`)
      }
      const active = [...document.querySelectorAll('[data-presentation-progress-item][data-active="true"], [data-presentation-toc-item][data-active="true"]')]
      const inactive = [...document.querySelectorAll('[data-presentation-progress-item][data-active="false"], [data-presentation-toc-item][data-active="false"]')]
      const indistinct = active.length && inactive.length && active.every((node) => {
        const a = getComputedStyle(node), b = getComputedStyle(inactive[0])
        return a.color === b.color && a.backgroundColor === b.backgroundColor && a.borderColor === b.borderColor && a.opacity === b.opacity && a.fontWeight === b.fontWeight
      })
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attrStyle = attribution && getComputedStyle(attribution)
      return { collisions, indistinct: Boolean(indistinct), attribution: !attribution || !attrStyle || parseFloat(attrStyle.fontSize) < 11 || attrStyle.textDecorationLine.includes('underline') && attrStyle.color === 'rgb(0, 0, 238)' }
    })
    for (const collision of warnings.collisions) console.warn(`WARN step ${index}: possible text overlap: ${collision}`)
    if (warnings.indistinct) console.warn(`WARN step ${index}: active progress/ToC state is not visually distinct`)
    if (warnings.attribution) console.warn(`WARN step ${index}: attribution is missing, browser-default, or undersized; style [data-presentation-attribution]`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  console.log(`Captured ${count} settled screenshots under ${output}`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
