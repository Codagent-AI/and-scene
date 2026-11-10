import { expect, it } from 'vitest'
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
