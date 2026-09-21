import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { collectVisualDiagnostics } from '../visual-diagnostics.mjs'

const DISTINCT_PROGRESS = '[data-presentation-progress-item="active"] { background-color: rgb(255,255,255); }'
const DISTINCT_TOC = '[data-presentation-toc-item="active"] { background-color: rgb(255,255,255); }'
const ALL_DISTINCT = DISTINCT_PROGRESS + DISTINCT_TOC

const chrome = ({ extra = '', attributionSize = '12px' } = {}) => `
  <nav data-presentation-progress>
    <button data-presentation-progress-item="active">1</button>
    <button>2</button>
  </nav>
  <nav data-presentation-toc>
    <button data-presentation-toc-item="active">the ask</button>
    <button>the build</button>
  </nav>
  <a data-presentation-attribution href="#" style="font-size:${attributionSize}">made by and-scene</a>
  ${extra}
`

const OVERLAPPING = `
  <div style="position:absolute;top:400px;left:40px"><span data-presentation-label>Alpha</span></div>
  <div style="position:absolute;top:400px;left:44px"><span data-presentation-label>Beta</span></div>
`

let browser: Browser
let page: Page

async function diagnose(html: string, css = ALL_DISTINCT) {
  await page.setContent(`<style>${css}</style>${html}`)
  return page.evaluate(collectVisualDiagnostics)
}

const containing = (fragment: string) => expect.arrayContaining([expect.stringContaining(fragment)])

beforeAll(async () => {
  browser = await chromium.launch()
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
}, 120_000)

afterAll(async () => { await browser?.close() })

describe('visual composition diagnostics', () => {
  it('stays silent on a well-formed, distinct composition', async () => {
    expect(await diagnose(chrome())).toEqual([])
  })

  it('reports an indistinct active progress indicator', async () => {
    expect(await diagnose(chrome(), DISTINCT_TOC)).toContain('active progress may be visually indistinct')
  })

  it('reports an indistinct active table-of-contents entry', async () => {
    expect(await diagnose(chrome(), DISTINCT_PROGRESS)).toContain('active table-of-contents entry may be visually indistinct')
  })

  it('reports undersized attribution', async () => {
    expect(await diagnose(chrome({ attributionSize: '8px' }))).toContain('attribution is missing or undersized; style [data-presentation-attribution]')
  })

  it('reports an unmarked overlap and exempts a marked one', async () => {
    expect(await diagnose(chrome({ extra: OVERLAPPING }))).toEqual(containing('unmarked overlap:'))
    expect(await diagnose(chrome({ extra: `<div data-allow-overlap>${OVERLAPPING}</div>` }))).not.toEqual(containing('unmarked overlap:'))
  })

  it('reports a partial overlap between scene entities, not just text', async () => {
    const entities = `
      <div data-presentation-arrow data-entity-id="link" style="position:absolute;top:500px;left:40px;width:120px;height:30px"></div>
      <div data-presentation-box data-entity-id="card" style="position:absolute;top:510px;left:120px;width:120px;height:60px"></div>
    `
    expect(await diagnose(chrome({ extra: entities }))).toEqual(containing('unmarked overlap: link / card'))
  })

  it('treats a frame that fully encloses an entity as composition, not collision', async () => {
    const framed = `
      <div data-presentation-frame data-entity-id="outer" style="position:absolute;top:500px;left:40px;width:300px;height:200px"></div>
      <div data-presentation-box data-entity-id="inner" style="position:absolute;top:540px;left:80px;width:100px;height:60px"></div>
    `
    expect(await diagnose(chrome({ extra: framed }))).not.toEqual(containing('unmarked overlap:'))
  })

  it('reports scene content that escapes the fixed canvas', async () => {
    const canvas = `
      <div data-presentation-canvas style="position:absolute;top:0;left:0;width:300px;height:200px">
        <div data-presentation-box data-entity-id="runaway" style="position:absolute;top:0;left:400px;width:80px;height:40px">out</div>
      </div>
    `
    expect(await diagnose(chrome({ extra: canvas }))).toEqual(containing('content outside fixed canvas: runaway'))
  })

  it('stays silent about canvas fit when the page has no canvas', async () => {
    expect(await diagnose(chrome())).toEqual([])
  })
})
