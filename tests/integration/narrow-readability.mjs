// Copied into a materialized production fixture by E2E-001. Reuses its build.
import assert from 'node:assert/strict'
import { withPreview, traverse } from './scripts/browser.mjs'
await withPreview(async (browser, url) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await traverse(page, url, 'how-to-make-a-presentation', async ({ page, index }) => {
    if (![0, 6, 8].includes(index)) return
    const result = await page.evaluate(() => {
      const canvas = document.querySelector('[data-presentation-canvas]')
      const scale = Number(canvas.getAttribute('data-scale'))
      const bounds = canvas.getBoundingClientRect()
      const labels = [...canvas.querySelectorAll('*')].filter(el => [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()) && el.getBoundingClientRect().width > 0)
      return {
        width: bounds.width,
        labels: labels.map(el => {
          const rect = el.getBoundingClientRect()
          return { text: el.textContent, size: parseFloat(getComputedStyle(el).fontSize) * scale, inside: rect.left >= bounds.left - 1 && rect.top >= bounds.top - 1 && rect.right <= bounds.right + 1 && rect.bottom <= bounds.bottom + 1 }
        }),
        caption: getComputedStyle(document.querySelector('[data-presentation-caption]')).fontSize,
        next: !document.querySelector('[data-presentation-controls] button:last-child').disabled,
      }
    })
    assert(result.width <= 350.1, 'Fixed canvas must still fit the narrow viewport')
    assert(result.labels.length > 0, 'Scene text must exist')
    for (const label of result.labels) {
      assert(label.size >= 12, `${label.text} displays at only ${label.size}px`)
      assert(label.inside, `${label.text} escapes the fitted canvas`)
    }
    assert(parseFloat(result.caption) >= 14, 'Caption must remain readable')
    assert.equal(result.next, index < 8, 'Navigation must retain its boundary state')
    console.log(`PASS narrow readability step ${index}: ${result.labels.length} labels`)
  })
})
