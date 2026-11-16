import { expect, it } from 'vitest'
// @ts-expect-error Shared node/browser JS module has no declaration file.
import { visualWarnings, collectVisualData, visibleStyleSignature } from '../scripts/diagnostics.mjs'
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
  for (const kind of ['progress', 'toc']) expect(visualWarnings({ texts: [], navigation: [{ kind, active: { color: 'black' }, inactive: { color: 'black' } }], attribution: polished })[0]).toMatch(`indistinct active ${kind}`)
  for (const attribution of [null, { ...polished, visible: false }, { ...polished, fontSize: 8 }, { ...polished, color: 'rgb(0, 0, 238)' }, { ...polished, fontFamily: 'Times New Roman', decoration: 'underline' }]) expect(visualWarnings({ texts: [], navigation: [], attribution })[0]).toMatch(/attribution.*data-presentation-attribution/)
  expect(visualWarnings({ texts: [], navigation: [{ kind: 'toc', active: { weight: '700' }, inactive: { weight: '400' } }], attribution: polished })).toEqual([])
})
it('I-32 errors aggregate with offending step and clean input passes', () => {
  expect(() => assertClean([], 2)).not.toThrow()
  expect(() => assertClean(['console boom', 'page boom'], 2)).toThrow('render: step 2: console boom; page boom')
})

it('I-35 text overlapping icon-only chrome warns while its own label does not', () => {
  const control = { kind: 'chrome', owner: 'icon', name: 'icon button', x: 0, y: 0, width: 40, height: 40 }
  const text = { kind: 'text', owner: null, name: 'external caption', x: 10, y: 10, width: 30, height: 15 }
  expect(visualWarnings({ texts: [text], chrome: [control], navigation: [], attribution: polished })).toEqual(['overlap: external caption <> icon button'])
  expect(visualWarnings({ texts: [{ ...text, owner: 'icon' }], chrome: [control], navigation: [], attribution: polished })).toEqual([])
})
it('I-36 invisible border colors cannot distinguish current navigation', () => {
  const style = (width: number, treatment: string, color: string) => ({ color: 'black', background: 'white', borders: [{ width, style: treatment, color }] })
  for (const [width, treatment] of [[0, 'solid'], [2, 'none'], [2, 'hidden']] as const) {
    const active = style(width, treatment, 'red'), inactive = style(width, treatment, 'blue')
    expect(visibleStyleSignature(active)).toBe(visibleStyleSignature(inactive))
    expect(visualWarnings({ texts: [], navigation: [{ kind: 'progress', active, inactive }], attribution: polished })).toEqual(['indistinct active progress: style [data-presentation-active="true"]'])
  }
  expect(visibleStyleSignature(style(1, 'solid', 'red'))).not.toBe(visibleStyleSignature(style(1, 'solid', 'blue')))
})
