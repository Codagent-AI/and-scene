import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inspectWarnings } from '../scripts/inspection-diagnostics.mjs'

describe('project-local inspection diagnostics', () => {
  let browser: Awaited<ReturnType<typeof chromium.launch>>
  beforeAll(async () => { browser = await chromium.launch({ headless: true }) })
  afterAll(async () => { await browser.close() })

  it('reports accidental overlap and weak chrome, while honoring an overlap exemption', async () => {
    const page = await browser.newPage()
    await page.setContent(`
      <style>
        body { margin: 0; font: 16px Arial; }
        [data-presentation-canvas] { position: relative; width: 600px; height: 300px; }
        .collision { position: absolute; left: 20px; top: 30px; }
        [data-presentation-progress], [data-presentation-toc-entry] { color: #111; background: #fff; border: 1px solid #999; font-weight: 400; }
      </style>
      <header data-presentation-header><span>header</span></header>
      <main data-presentation-canvas>
        <span class="collision" data-presentation-node="label">collision one</span>
        <span class="collision" data-presentation-node="label">collision two</span>
        <div data-presentation-allow-overlap>
          <span class="collision">intentional one</span><span class="collision">intentional two</span>
        </div>
      </main>
      <nav><button data-presentation-toc-entry data-presentation-active="true">Era one</button><button data-presentation-toc-entry>Era two</button></nav>
      <footer data-presentation-footer>
        <button data-presentation-progress data-presentation-active="true">1</button><button data-presentation-progress>2</button>
        <a data-presentation-attribution href="#">made by and-scene</a>
      </footer>`)
    try {
      const warnings = await page.evaluate(inspectWarnings)
      expect(warnings.some(warning => warning.startsWith('text/chrome overlap:'))).toBe(true)
      expect(warnings).toContain('active progress state is visually indistinct')
      expect(warnings).toContain('active table-of-contents state is visually indistinct')
      expect(warnings.some(warning => warning.startsWith('attribution appears browser-default'))).toBe(true)
      expect(warnings.some(warning => warning.includes('intentional one') || warning.includes('intentional two'))).toBe(false)
    } finally { await page.close() }
  })
})
