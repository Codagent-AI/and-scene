import { JSDOM } from 'jsdom'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectPage, isIndistinct } from '../../../scripts/inspect-presentation.mjs'

interface Dot {
  text?: string
  style: string
}

// collectPage runs in the browser, so it reads the document through globals; give it a jsdom one.
const dom = new JSDOM('<!doctype html><body></body>')

function mount(dots: Dot[]) {
  dom.window.document.body.innerHTML = `<div data-presentation-root>${dots
    .map((dot, i) => `<button data-presentation-progress-dot${i === 0 ? ' data-presentation-active="true"' : ''} style="${dot.style}">${dot.text ?? ''}</button>`)
    .join('')}</div>`
}

const progressIsIndistinct = () => {
  const { progress } = collectPage()
  return isIndistinct(progress.active, progress.inactive)
}

beforeAll(() => {
  // jsdom has no layout: text ranges report no boxes, which leaves no overlap candidates.
  dom.window.Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  vi.stubGlobal('document', dom.window.document)
  vi.stubGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window))
  vi.stubGlobal('SVGElement', dom.window.SVGElement)
})

beforeEach(() => {
  dom.window.document.body.innerHTML = ''
})

afterAll(() => {
  vi.unstubAllGlobals()
  dom.window.close()
})

describe('active progress diagnostics on empty controls', () => {
  const dot = (color: string) => ({ style: `width: 12px; height: 12px; background: white; border: 1px solid black; color: ${color}` })

  it('is not fooled by a text color that an empty control never paints', () => {
    mount([dot('red'), dot('blue'), dot('blue')])
    expect(progressIsIndistinct()).toBe(true)
  })

  it('still sees a background, border or size change as a distinct active dot', () => {
    mount([{ style: 'width: 12px; height: 12px; background: gold; border: 1px solid black' }, dot('blue'), dot('blue')])
    expect(progressIsIndistinct()).toBe(false)
    mount([{ style: 'width: 24px; height: 12px; background: white; border: 1px solid black' }, dot('blue'), dot('blue')])
    expect(progressIsIndistinct()).toBe(false)
  })

  it('counts a text color change on a control that paints a label', () => {
    const labeled = (color: string) => ({ text: '1', style: `width: 12px; height: 12px; background: white; border: 1px solid black; color: ${color}` })
    mount([labeled('red'), labeled('blue'), labeled('blue')])
    expect(progressIsIndistinct()).toBe(false)
  })
})
