import { describe, expect, it } from 'vitest'
// @ts-expect-error -- plain-JS inspection helper shared with the browser-side script
import { diagnose } from '../scripts/diagnose.mjs'

type Rect = { left: number; top: number; right: number; bottom: number }
type Style = { color?: string; backgroundColor?: string; visibility?: string; fontSize?: string }
type ElementSpec = { selectors: string[]; className: string; rect: Rect; style?: Style; allowedBy?: ElementSpec }

const styleOf = (spec: ElementSpec) => ({ color: 'rgb(1, 1, 1)', backgroundColor: 'rgb(2, 2, 2)', visibility: 'visible', fontSize: '14px', ...spec.style })

function fakeElement(spec: ElementSpec) {
  return {
    className: spec.className,
    getBoundingClientRect: () => ({ ...spec.rect, width: spec.rect.right - spec.rect.left, height: spec.rect.bottom - spec.rect.top }),
    closest: (selector: string) => (selector === '[data-presentation-overlap-allowed]' && spec.allowedBy ? fakeElement(spec.allowedBy) : null),
    spec,
  }
}

const matches = (spec: ElementSpec, selector: string) => selector.split(',').map((part) => part.trim()).some((part) => spec.selectors.includes(part))

function fakeDocument(specs: ElementSpec[]) {
  const doc = {
    querySelectorAll: (selector: string) => specs.filter((spec) => matches(spec, selector)).map(fakeElement),
    querySelector: (selector: string) => {
      const found = specs.find((spec) => matches(spec, selector))
      return found ? fakeElement(found) : null
    },
  }
  return { doc, computedStyle: (target: { spec: ElementSpec }) => styleOf(target.spec) }
}

const caption = (rect: Rect, extra: Partial<ElementSpec> = {}): ElementSpec => ({ selectors: ['[data-presentation-caption]'], className: 'caption', rect, ...extra })
const controls = (rect: Rect, extra: Partial<ElementSpec> = {}): ElementSpec => ({ selectors: ['[data-presentation-controls]'], className: 'controls', rect, ...extra })
const decoration = (kind: string, rect: Rect): ElementSpec => ({ selectors: [`[data-presentation-node="${kind}"]`], className: `how-to-${kind}`, rect })
const activeChrome: ElementSpec = { selectors: ['[data-presentation-progress-item][aria-current="step"]'], className: 'progress active', rect: { left: 0, top: 500, right: 20, bottom: 510 } }
const inactiveChrome: ElementSpec = { selectors: ['[data-presentation-progress-item]:not([aria-current="step"])'], className: 'progress', rect: { left: 30, top: 500, right: 50, bottom: 510 }, style: { color: 'rgb(9, 9, 9)', backgroundColor: 'rgb(8, 8, 8)' } }
const attribution: ElementSpec = { selectors: ['[data-presentation-attribution]'], className: 'attribution', rect: { left: 700, top: 700, right: 800, bottom: 715 } }

// Everything routes through here so each test states only what it varies from a
// clean step: distinct active chrome and legible attribution.
function run(specs: ElementSpec[], chrome: ElementSpec[] = [activeChrome, inactiveChrome, attribution], step = 0) {
  const { doc, computedStyle } = fakeDocument([...specs, ...chrome])
  return diagnose(step, doc, computedStyle) as string[]
}

const overlapping = [caption({ left: 0, top: 0, right: 100, bottom: 50 }), controls({ left: 50, top: 20, right: 150, bottom: 70 })] as const

describe('inspection diagnostics contract', () => {
  it('reports unmarked overlap between visible text and chrome', () => {
    const warnings = run([...overlapping])
    expect(warnings).toEqual([expect.stringContaining('overlap')])
    expect(warnings[0]).toContain('step 1')
  })

  it('numbers warnings by the step being inspected', () => {
    expect(run([...overlapping], undefined, 5)[0]).toContain('step 6')
  })

  it('exempts overlap through the explicit allow-overlap marker', () => {
    const tray: ElementSpec = { selectors: ['[data-presentation-overlap-allowed]'], className: 'tray', rect: { left: 0, top: 0, right: 200, bottom: 100 } }
    expect(run(overlapping.map((spec) => ({ ...spec, allowedBy: tray })))).toEqual([])
  })

  it('does not exempt overlap for presentation-specific class names', () => {
    expect(run([{ ...overlapping[0], className: 'how-to-arrow' }, { ...overlapping[1], className: 'how-to-reveal' }])).toEqual([expect.stringContaining('overlap')])
  })

  it('does not treat scene decoration as an overlap candidate', () => {
    expect(run([caption({ left: 0, top: 0, right: 100, bottom: 50 }), decoration('arrow', { left: 50, top: 20, right: 150, bottom: 70 }), decoration('frame', { left: 0, top: 0, right: 200, bottom: 100 })])).toEqual([])
  })

  it('ignores elements with no painted box', () => {
    expect(run([caption({ left: 0, top: 0, right: 0, bottom: 0 }), controls({ left: 50, top: 20, right: 150, bottom: 70 })])).toEqual([])
  })

  it('ignores elements hidden by visibility', () => {
    expect(run([caption({ left: 0, top: 0, right: 100, bottom: 50 }, { style: { visibility: 'hidden' } }), controls({ left: 50, top: 20, right: 150, bottom: 70 })])).toEqual([])
  })

  it('reports indistinct active navigation chrome', () => {
    expect(run([], [activeChrome, { ...inactiveChrome, style: undefined }, attribution])).toEqual([expect.stringContaining('visually indistinct')])
  })

  it('reports undersized or browser-default attribution', () => {
    expect(run([], [activeChrome, inactiveChrome, { ...attribution, style: { fontSize: '9px' } }])).toEqual([expect.stringContaining('attribution')])
    expect(run([], [activeChrome, inactiveChrome, { ...attribution, style: { color: 'rgb(0, 0, 238)' } }])).toEqual([expect.stringContaining('attribution')])
  })

  it('reports missing active state and missing attribution', () => {
    expect(run([], [])).toEqual([expect.stringContaining('active navigation state is missing'), expect.stringContaining('attribution is missing')])
  })
})
