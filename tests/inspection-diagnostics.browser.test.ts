import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// @ts-expect-error -- plain-JS inspection helper shared with the browser-side script
import { diagnose } from '../scripts/diagnose.mjs'

// The unit tests drive `diagnose` through hand-written DOM stubs. This suite runs the
// same function inside a real page so the selector engine, layout and computed styles
// are the browser's own — the layer where a diagnostic can silently stop matching.

const CHROME = `
  <nav data-presentation-toc>
    <button data-presentation-toc-item aria-current="step" class="toc active">the ask</button>
    <button data-presentation-toc-item class="toc">the build</button>
  </nav>
  <p data-presentation-caption class="caption">a caption</p>
  <footer data-presentation-controls class="controls">
    <button data-presentation-progress-item aria-current="step" class="progress active"></button>
    <button data-presentation-progress-item class="progress"></button>
  </footer>
  <a data-presentation-attribution class="attribution" href="#">made by and-scene</a>
`

const BASE_CSS = `
  body { margin: 0; font-size: 14px; color: rgb(20, 20, 20); }
  [data-presentation-toc] { position: absolute; left: 0; top: 0; }
  [data-presentation-toc-item] { display: block; width: 80px; height: 16px; color: rgb(133, 131, 149); background: rgb(10, 10, 10); }
  [data-presentation-toc-item][aria-current="step"] { color: rgb(240, 179, 91); }
  [data-presentation-controls] { position: absolute; left: 0; top: 300px; }
  [data-presentation-caption] { position: absolute; left: 0; top: 200px; width: 200px; height: 20px; margin: 0; }
  [data-presentation-progress-item] { width: 22px; height: 8px; border: 0; background: rgb(48, 47, 61); }
  [data-presentation-progress-item][aria-current="step"] { background: rgb(240, 179, 91); }
  [data-presentation-attribution] { position: absolute; right: 18px; bottom: 14px; font-size: 12px; color: rgb(171, 164, 184); }
`

let browser: Browser

async function warningsFor(css: string, body = CHROME) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  try {
    await page.setContent(`<style>${BASE_CSS}${css}</style>${body}`)
    return (await page.evaluate(diagnose, 0)) as string[]
  } finally {
    await page.close()
  }
}

describe('inspection diagnostics in a real browser', () => {
  beforeAll(async () => { browser = await chromium.launch({ headless: true }) }, 60_000)
  afterAll(async () => { await browser?.close() })

  it('stays quiet on well-formed chrome', async () => {
    expect(await warningsFor('')).toEqual([])
  })

  it('reports an indistinct active progress indicator while the table of contents stays distinct', async () => {
    const warnings = await warningsFor('[data-presentation-progress-item][aria-current="step"] { background: rgb(48, 47, 61); }')
    expect(warnings).toEqual([expect.stringContaining('active progress state is visually indistinct')])
  })

  it('reports an indistinct active table-of-contents entry while the progress bar stays distinct', async () => {
    const warnings = await warningsFor('[data-presentation-toc-item][aria-current="step"] { color: rgb(133, 131, 149); }')
    expect(warnings).toEqual([expect.stringContaining('active table-of-contents state is visually indistinct')])
  })

  it('stays quiet about a control family the layout does not render', async () => {
    expect(await warningsFor('[data-presentation-toc] { display: none; }')).toEqual([])
  })

  it('reports unmarked overlap and stays quiet about a marked one', async () => {
    const collide = '[data-presentation-caption] { top: 295px; height: 40px; }'
    expect(await warningsFor(collide)).toEqual([expect.stringContaining('overlap')])
    expect(await warningsFor(collide, CHROME.replace('data-presentation-caption', 'data-presentation-caption data-presentation-overlap-allowed'))).toEqual([])
  })

  it('reports hidden and unpolished attribution', async () => {
    expect(await warningsFor('[data-presentation-attribution] { display: none; }')).toEqual([expect.stringContaining('attribution is hidden')])
    expect(await warningsFor('[data-presentation-attribution] { font-size: 9px; }')).toEqual([expect.stringContaining('too small or browser-default')])
  })
})
