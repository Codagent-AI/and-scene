import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { collectVisualDiagnostics } from '../visual-diagnostics.mjs'

const chrome = (extra: string) => `
  <nav data-presentation-progress>
    <button data-presentation-progress-item="active">1</button>
    <button>2</button>
  </nav>
  <nav data-presentation-toc>
    <button data-presentation-toc-item="active">the ask</button>
    <button>the build</button>
  </nav>
  <a data-presentation-attribution href="#" style="font-size:12px">made by and-scene</a>
  ${extra}
`

let browser: Browser
let page: Page

async function diagnose(html: string, css = '') {
  await page.setContent(`<style>${css}</style>${html}`)
  return page.evaluate(collectVisualDiagnostics)
}

beforeAll(async () => {
  browser = await chromium.launch()
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
}, 120_000)

afterAll(async () => { await browser?.close() })

describe('visual composition diagnostics', () => {
  it('stays silent on a well-formed, distinct composition', async () => {
    const css = '[data-presentation-progress-item="active"], [data-presentation-toc-item="active"] { background-color: rgb(255,255,255); }'
    expect(await diagnose(chrome(''), css)).toEqual([])
  })

  it('reports an indistinct active progress indicator', async () => {
    const css = '[data-presentation-toc-item="active"] { background-color: rgb(255,255,255); }'
    expect(await diagnose(chrome(''), css)).toContain('active progress may be visually indistinct')
  })

  it('reports an indistinct active table-of-contents entry', async () => {
    const css = '[data-presentation-progress-item="active"] { background-color: rgb(255,255,255); }'
    expect(await diagnose(chrome(''), css)).toContain('active table-of-contents entry may be visually indistinct')
  })

  it('reports undersized attribution', async () => {
    const html = chrome('').replace('font-size:12px', 'font-size:8px')
    const css = '[data-presentation-progress-item="active"], [data-presentation-toc-item="active"] { background-color: rgb(255,255,255); }'
    expect(await diagnose(html, css)).toContain('attribution is missing or undersized; style [data-presentation-attribution]')
  })

  it('reports an unmarked overlap and exempts a marked one', async () => {
    const overlapping = `
      <div style="position:absolute;top:400px;left:40px"><span data-presentation-label>Alpha</span></div>
      <div style="position:absolute;top:400px;left:44px"><span data-presentation-label>Beta</span></div>
    `
    const css = '[data-presentation-progress-item="active"], [data-presentation-toc-item="active"] { background-color: rgb(255,255,255); }'
    const unmarked = await diagnose(chrome(overlapping), css)
    expect(unmarked.some((warning) => warning.startsWith('unmarked overlap:'))).toBe(true)

    const marked = await diagnose(chrome(`<div data-allow-overlap>${overlapping}</div>`), css)
    expect(marked.some((warning) => warning.startsWith('unmarked overlap:'))).toBe(false)
  })
})
