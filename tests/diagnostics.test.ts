import { expect, it } from 'vitest'
// @ts-expect-error Shared node/browser JS module has no declaration file.
import { visualWarnings, collectVisualData } from '../scripts/diagnostics.mjs'
// @ts-expect-error Shared CLI JS module has no declaration file.
import { assertClean } from '../scripts/browser.mjs'
const polished = { fontSize: 12, visible: true, color: 'rgb(30, 60, 50)', fontFamily: 'Arial', decoration: 'none' }
it('I-35 collision rectangles separated and intersecting', () => {
  const a = { name: 'a', x: 0, y: 0, width: 30, height: 20 }
  const b = { name: 'b', x: 20, y: 0, width: 30, height: 20 }
  expect(visualWarnings({ texts: [a,b], navigation: [], attribution: polished })).toEqual(['overlap: a <> b'])
  expect(visualWarnings({ texts: [a,{ ...b, x: 30 }], navigation: [], attribution: polished })).toEqual([])
})
it('I-35 hidden and marked subtree texts are excluded before collision checks', () => {
  document.body.innerHTML = '<main data-presentation><div data-presentation-allow-overlap><span>exempt</span></div><span style="visibility:hidden">hidden</span><span style="opacity:0">transparent</span></main>'
  expect(collectVisualData().texts).toEqual([])
})
it('I-36 navigation signatures and attribution defects', () => {
  for (const kind of ['progress', 'toc']) expect(visualWarnings({ texts: [], navigation: [{ kind, active: 'same', inactive: 'same' }], attribution: polished })[0]).toMatch(`indistinct active ${kind}`)
  for (const attribution of [null, { ...polished, visible: false }, { ...polished, fontSize: 8 }, { ...polished, color: 'rgb(0, 0, 238)' }, { ...polished, fontFamily: 'Times New Roman', decoration: 'underline' }]) expect(visualWarnings({ texts: [], navigation: [], attribution })[0]).toMatch(/attribution.*data-presentation-attribution/)
  expect(visualWarnings({ texts: [], navigation: [{ kind: 'toc', active: 'bold', inactive: 'normal' }], attribution: polished })).toEqual([])
})
it('I-32 errors aggregate with offending step and clean input passes', () => {
  expect(() => assertClean([], 2)).not.toThrow()
  expect(() => assertClean(['console boom', 'page boom'], 2)).toThrow('render: step 2: console boom; page boom')
})
