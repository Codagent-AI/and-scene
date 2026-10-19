import { describe, expect, it } from 'vitest'
import {
  analyzeSnapshot, BROWSER_DEFAULT_LINK_COLOR, collectSnapshot, formatWarning, MIN_ATTRIBUTION_PX,
} from '../../scripts/lib/diagnostics.mjs'

type Rect = { left: number; top: number; right: number; bottom: number }
const rect = (left: number, top: number, w: number, h: number): Rect => ({ left, top, right: left + w, bottom: top + h })
const el = (label: string, path: string, r: Rect, allow = false) => ({ label, path, rect: r, allow })
const polished = { visible: true, fontSize: 13, color: 'rgb(200, 200, 200)', textDecorationLine: 'none' }
const sig = (over: Record<string, string> = {}) => ({ backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)', width: '10px', ...over })
const distinctChrome = { active: sig({ width: '26px' }), inactive: [sig(), sig()] }

const snapshot = (over: object = {}) => ({ elements: [], progress: distinctChrome, toc: null, attribution: polished, ...over })
const kinds = (s: object, step = 1) => analyzeSnapshot(snapshot(s), step).map((w: { kind: string }) => w.kind)

describe('overlap diagnostics', () => {
  it('warns on overlapping unmarked text with step and both element labels', () => {
    const warnings = analyzeSnapshot(
      snapshot({ elements: [el('A "one"', '0/1', rect(0, 0, 100, 20)), el('B "two"', '0/2', rect(50, 10, 100, 20))] }),
      4,
    )
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({ step: 4, kind: 'overlap' })
    expect(warnings[0].message).toContain('A "one"')
    expect(warnings[0].message).toContain('B "two"')
    expect(formatWarning(warnings[0])).toMatch(/^WARN step 04 \[overlap\]/)
  })

  it('ignores hidden/nonintersecting/touching elements', () => {
    const els = [el('a', '0/1', rect(0, 0, 100, 20)), el('b', '0/2', rect(100, 0, 50, 20)), el('c', '0/3', rect(0, 40, 50, 20))]
    expect(kinds({ elements: els })).toEqual([])
  })

  it('does not warn for text inside its own container, but does for sibling text collisions', () => {
    const container = el('li', '0/1', rect(0, 0, 200, 40))
    const inside = el('span', '0/1/0', rect(10, 10, 80, 20))
    expect(kinds({ elements: [container, inside] })).toEqual([])
    const sibling = el('p', '0/2', rect(20, 10, 80, 20))
    expect(kinds({ elements: [inside, sibling] })).toEqual(['overlap'])
  })

  it('does not confuse path prefixes: 0/1 is not an ancestor of 0/10', () => {
    const a = el('a', '0/1', rect(0, 0, 100, 20))
    const b = el('b', '0/10', rect(0, 0, 100, 20))
    expect(kinds({ elements: [a, b] })).toEqual(['overlap'])
  })

  it('exempts allow-marked elements only; an unmarked collision elsewhere still warns', () => {
    const marked = el('marked', '0/1', rect(0, 0, 100, 20), true)
    const markedChild = el('child', '0/1/0', rect(10, 5, 50, 10), true)
    const under = el('under', '0/2', rect(0, 0, 100, 20))
    expect(kinds({ elements: [marked, markedChild, under] })).toEqual([])
    const x = el('x', '0/3', rect(300, 0, 50, 20))
    const y = el('y', '0/4', rect(320, 0, 50, 20))
    expect(kinds({ elements: [marked, markedChild, under, x, y] })).toEqual(['overlap'])
  })
})

describe('active chrome diagnostics', () => {
  it('warns when the active progress indicator looks like the inactive ones', () => {
    const same = { active: sig(), inactive: [sig(), sig()] }
    expect(kinds({ progress: same })).toEqual(['active-chrome'])
    expect(analyzeSnapshot(snapshot({ progress: same }), 2)[0].message).toMatch(/progress indicator/)
  })

  it('warns separately for the table of contents', () => {
    const same = { active: sig(), inactive: [sig()] }
    const warnings = analyzeSnapshot(snapshot({ toc: same }), 1)
    expect(warnings.map((w: { kind: string }) => w.kind)).toEqual(['active-chrome'])
    expect(warnings[0].message).toMatch(/table-of-contents/)
  })

  it('accepts any visible difference and compares against the modal inactive style', () => {
    expect(kinds({ progress: distinctChrome })).toEqual([])
    for (const key of ['backgroundColor', 'color', 'width', 'boxShadow']) {
      expect(kinds({ progress: { active: sig({ [key]: 'x' }), inactive: [sig()] } })).toEqual([])
    }
    const mixed = { active: sig({ width: '26px' }), inactive: [sig({ width: '26px' }), sig(), sig()] }
    expect(kinds({ progress: mixed })).toEqual([])
  })

  it('skips absent chrome (no ToC on narrow viewports)', () => {
    expect(kinds({ progress: null, toc: null })).toEqual([])
    expect(kinds({ progress: { active: sig(), inactive: [] } })).toEqual([])
  })
})

describe('attribution diagnostics', () => {
  const hook = /\[data-presentation-attribution\]/

  it('warns for text under the minimum size, not at it', () => {
    const small = analyzeSnapshot(snapshot({ attribution: { ...polished, fontSize: MIN_ATTRIBUTION_PX - 0.5 } }), 3)
    expect(small).toHaveLength(1)
    expect(small[0].message).toMatch(hook)
    expect(small[0].step).toBe(3)
    expect(kinds({ attribution: { ...polished, fontSize: MIN_ATTRIBUTION_PX } })).toEqual([])
  })

  it('warns for the browser-default link style only when both colour and underline are default', () => {
    const def = { ...polished, color: BROWSER_DEFAULT_LINK_COLOR, textDecorationLine: 'underline' }
    const warnings = analyzeSnapshot(snapshot({ attribution: def }), 1)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toMatch(hook)
    expect(kinds({ attribution: { ...def, textDecorationLine: 'none' } })).toEqual([])
    expect(kinds({ attribution: { ...def, color: 'rgb(1, 2, 3)' } })).toEqual([])
  })

  it('warns when the attribution is missing or hidden, naming the hook and option', () => {
    for (const attribution of [null, { ...polished, visible: false }]) {
      const [warning] = analyzeSnapshot(snapshot({ attribution }), 5)
      expect(warning).toMatchObject({ step: 5, kind: 'attribution' })
      expect(warning.message).toMatch(hook)
      expect(warning.message).toMatch(/attribution option/)
    }
  })

  it('stays quiet for a polished attribution', () => {
    expect(analyzeSnapshot(snapshot(), 1)).toEqual([])
  })
})

describe('collectSnapshot visibility (DOM derived)', () => {
  const box = { left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 }

  function collect(html: string) {
    document.body.innerHTML = html
    const originalRange = document.createRange.bind(document)
    // jsdom has no layout: give every element and text range a real-looking box
    Element.prototype.getBoundingClientRect = () => box as DOMRect
    document.createRange = () => Object.assign(originalRange(), { getBoundingClientRect: () => box as DOMRect })
    return collectSnapshot(document, window)
  }

  it('treats an attribution inside a zero-opacity ancestor as hidden and warns', () => {
    const snap = collect('<div style="opacity:0"><a data-presentation-attribution href="/x">made by and-scene</a></div>')
    expect(snap.attribution?.visible).toBe(false)
    expect(analyzeSnapshot(snap, 1).map((w: { kind: string }) => w.kind)).toContain('attribution')
  })

  it('treats a display:none ancestor as hidden', () => {
    const snap = collect('<div style="display:none"><a data-presentation-attribution href="/x">x</a></div>')
    expect(snap.attribution?.visible).toBe(false)
  })

  it('keeps a plainly visible attribution visible', () => {
    expect(collect('<a data-presentation-attribution href="/x">x</a>').attribution?.visible).toBe(true)
  })

  it('collects no text from invisible subtrees, so hidden text cannot collide', () => {
    const snap = collect('<p>shown</p><div style="opacity:0"><p>ghost</p></div>')
    expect(snap.elements.map((e: { label: string }) => e.label).join()).toMatch(/shown/)
    expect(snap.elements.map((e: { label: string }) => e.label).join()).not.toMatch(/ghost/)
  })

  it('ignores intrinsic width of labelled controls when comparing active chrome, but not of icon-like ones', () => {
    const styleOf = (width: number) => `width:${width}px;display:inline-block`
    const labelled = collect(
      `<button data-presentation-toc-entry aria-current="step" style="${styleOf(40)}">A</button><button data-presentation-toc-entry style="${styleOf(90)}">Longer</button>`,
    )
    expect(labelled.toc?.active).not.toHaveProperty('width')
    expect(analyzeSnapshot(labelled, 1).map((w: { kind: string }) => w.kind)).toContain('active-chrome')
    const dots = collect(
      `<button data-presentation-progress-dot aria-current="step" style="${styleOf(28)}"></button><button data-presentation-progress-dot style="${styleOf(10)}"></button>`,
    )
    expect(dots.progress?.active).toHaveProperty('width')
    expect(analyzeSnapshot(dots, 1).map((w: { kind: string }) => w.kind)).not.toContain('active-chrome')
  })
})
