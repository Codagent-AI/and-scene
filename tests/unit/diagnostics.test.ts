import { expect, it, vi } from 'vitest'
// @ts-expect-error executable browser diagnostics
import { collectVisuals, diagnose } from '../../scripts/diagnostics.mjs'
const polished = { size: 12, color: 'rgb(40, 80, 60)', decoration: 'none' }
it('I-41 collision rectangles warn only for actual intersections', () => {
  const a = { id: 'a', left: 0, top: 0, right: 100, bottom: 20 }
  expect(diagnose({ boxes: [a, { ...a, id: 'b', left: 50 }], chrome: [], attribution: polished })).toEqual(['overlap: a / b'])
  expect(diagnose({ boxes: [a, { ...a, id: 'b', left: 100, right: 120 }], chrome: [], attribution: polished })).toEqual([])
})
it('I-41 visible filtering and allow-overlap subtree exemption', () => {
  document.body.innerHTML = '<main data-presentation><div data-presentation-allow-overlap><span>allowed</span></div><span style="display:none">hidden</span><span style="visibility:hidden">invisible</span><span style="opacity:0">transparent</span></main>'
  expect(collectVisuals().boxes).toEqual([])
})
it('I-42 diagnoses indistinct progress/ToC, missing default and undersized attribution', () => {
  for (const kind of ['toc', 'progress']) expect(diagnose({ boxes: [], chrome: [{ kind, active: 'same', inactive: ['same'] }], attribution: polished })).toEqual([`indistinct active ${kind} chrome`])
  for (const attribution of [null, { ...polished, size: 9 }, { size: 16, color: 'rgb(0, 0, 238)', decoration: 'underline' }, { size: 16, color: 'rgb(85, 26, 139)', decoration: 'underline' }]) expect(diagnose({ boxes: [], chrome: [], attribution })).toEqual(['unpolished attribution: style [data-presentation-attribution] a'])
  expect(diagnose({ boxes: [], chrome: [{ kind: 'toc', active: 'bold', inactive: ['normal'] }], attribution: polished })).toEqual([])
})

it('I-41 direct text ranges avoid false parent-child collisions and ignore invisible ancestors', () => {
  const rect = (top: number, bottom: number) => ({ left: 0, right: 100, top, bottom, width: 100, height: bottom - top, x: 0, y: top, toJSON() {} })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(0, 30))
  const oldRects = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects')
  const oldRect = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect')
  function measured(this: Range) {
    return this.startContainer.textContent === 'parent' ? rect(0, 10) : this.startContainer.textContent === 'child' ? rect(20, 30) : rect(0, 30)
  }
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: function(this: Range) { return [measured.call(this)] } })
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: measured })
  try {
    document.body.innerHTML = '<main data-presentation><div>parent<small>child</small></div><div style="opacity:0"><span>invisible descendant</span></div><div data-presentation-allow-overlap><span>exempt</span></div></main>'
    const data = collectVisuals()
    expect(data.boxes.map((b: { top: number; bottom: number }) => [b.top, b.bottom])).toEqual([[0, 10], [20, 30]])
    expect(diagnose(data).filter((w: string) => w.startsWith('overlap:'))).toEqual([])
  } finally {
    for (const [name, descriptor] of [['getClientRects', oldRects], ['getBoundingClientRect', oldRect]] as const) {
      if (descriptor) Object.defineProperty(Range.prototype, name, descriptor)
      else Reflect.deleteProperty(Range.prototype, name)
    }
  }
})
it('I-41 chrome bounds catch external text and control collisions but exclude their own labels', () => {
  const label = { id: 'label', left: 10, right: 30, top: 10, bottom: 20, kind: 'text', owner: 1, ancestors: [0] }
  const control = { id: 'textless-control', left: 0, right: 100, top: 0, bottom: 40, kind: 'control', owner: 2, ancestors: [0] }
  const run = (boxes: object[]) => diagnose({ boxes, chrome: [], attribution: polished })
  expect(run([label, control])).toEqual(['overlap: label / textless-control'])
  expect(run([label, { ...control, kind: 'chrome', id: 'painted-panel' }])).toEqual(['overlap: label / painted-panel'])
  expect(run([control, { ...label, owner: 2 }])).toEqual([])
  expect(run([control, { ...label, ancestors: [2, 0] }])).toEqual([])
  expect(run([control, { ...control, owner: 3, id: 'other-control' }])).toEqual(['overlap: textless-control / other-control'])
})
