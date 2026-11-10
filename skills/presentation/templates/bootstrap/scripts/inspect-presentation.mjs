import { mkdir, writeFile } from 'node:fs/promises'
import { build, withPreview, walk } from './browser.mjs'
const slug = process.argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Usage: npm run inspect -- <presentation-slug>')
try {
  await build()
  const directory = `inspection/${slug}`
  await mkdir(directory, { recursive: true })
  const diagnostics = []
  await withPreview(async (browser, url) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await walk(page, url, slug, async (page, index) => {
      const warnings = await page.evaluate(() => {
        const warnings = []
        const visible = element => {
          const style = getComputedStyle(element), rect = element.getBoundingClientRect()
          return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
        }
        const text = [...document.querySelectorAll('body *')].filter(element => visible(element) && !element.closest('[data-presentation-allow-overlap]') && [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()))
        for (let a = 0; a < text.length; a++) for (let b = a + 1; b < text.length; b++) {
          if (text[a].contains(text[b]) || text[b].contains(text[a])) continue
          const bounds = element => { const range = document.createRange(); const nodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()); range.setStartBefore(nodes[0]); range.setEndAfter(nodes[nodes.length - 1]); return range.getBoundingClientRect() }; const x = bounds(text[a]), y = bounds(text[b])
          if (Math.min(x.right, y.right) - Math.max(x.left, y.left) > 2 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 2) warnings.push(`overlap: ${text[a].textContent.trim()} / ${text[b].textContent.trim()}`)
        }
        const signature = el => { const s = getComputedStyle(el); return [s.color, s.backgroundColor, s.borderColor, s.fontWeight, s.boxShadow, s.outlineStyle, s.textDecoration].join('|') }
        for (const hook of ['progress', 'toc']) {
          const nav = document.querySelector(`[data-presentation-${hook}]`)
          if (!nav) continue
          const active = nav.querySelector('[data-presentation-active="true"]'), inactive = nav.querySelector('[data-presentation-active="false"]')
          if (active && inactive && signature(active) === signature(inactive)) warnings.push(`indistinct active ${hook}`)
        }
        const attribution = document.querySelector('[data-presentation-attribution]')
        if (!attribution || !visible(attribution)) warnings.push('missing attribution [data-presentation-attribution]')
        else { const style = getComputedStyle(attribution); if (parseFloat(style.fontSize) < 11 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color)) warnings.push('unpolished attribution [data-presentation-attribution]') }
        return warnings
      })
      const file = `${directory}/step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: file })
      diagnostics.push({ index, file, warnings })
      for (const warning of warnings) console.warn(`ADVISORY step ${index}: ${warning}`)
    })
  })
  await writeFile(`${directory}/diagnostics.json`, JSON.stringify(diagnostics, null, 2))
  console.log(`Captured ${diagnostics.length} settled steps in ${directory}`)
} catch (error) { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 }
