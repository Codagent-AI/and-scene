import { test, expect, vi, afterEach } from 'vitest'
// @ts-expect-error JavaScript browser function tested directly.
import { diagnose } from '../scripts/diagnostics.mjs'
Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value() { return [] } })
const rect = (x: number) => ({ left: x, top: 0, right: x + 40, bottom: 20, width: 40, height: 20 })
function setup(html: string) {
  document.head.innerHTML = '<style>* { opacity: 1; } a { color: rgb(70,100,70); font-family: sans-serif; font-size: 14px; }</style>'
  document.body.innerHTML = `<main data-presentation>${html}</main>`
  vi.spyOn(Element.prototype,'getClientRects').mockImplementation(function(this: Element) { return [rect(Number(this.getAttribute('data-x') || 0))] as unknown as DOMRectList })
  vi.spyOn(Range.prototype,'getClientRects').mockImplementation(function(this: Range) { const el = this.startContainer.parentElement!; return [rect(Number(el.getAttribute('data-x') || 0))] as unknown as DOMRectList })
}
afterEach(() => { vi.restoreAllMocks(); document.head.innerHTML=''; document.body.innerHTML='' })
test('I-47 collisions report elements and allowed hidden subtrees are exempt', () => {
  setup('<span>alpha</span><span>beta</span><div data-presentation-allow-overlap><span>allowed</span></div><span style="display:none">hidden</span><a data-x="500" data-presentation-attribution>made by and-scene</a>')
  const warnings = diagnose(); expect(warnings).toContain('overlap: alpha / beta'); expect(warnings.join(' ')).not.toContain('allowed'); expect(warnings.join(' ')).not.toContain('hidden')
})
test('I-48 indistinct progress and ToC warn; local active style clears warning', () => {
  setup(['progress-step','toc-entry'].map(hook => `<button data-presentation-${hook} data-presentation-active="true">active</button><button data-presentation-${hook} data-presentation-active="false">other</button>`).join(''))
  expect(diagnose().filter((s: string) => s.includes('indistinct'))).toHaveLength(2)
  document.head.insertAdjacentHTML('beforeend','<style>[data-presentation-active="true"] { background-color: rgb(20,90,20); font-weight: 700; }</style>')
  expect(diagnose().filter((s: string) => s.includes('indistinct'))).toHaveLength(0)
})
test('I-49 attribution missing default undersized and polished classifications', () => {
  setup(''); expect(diagnose().join(' ')).toContain('missing attribution')
  document.querySelector('main')!.innerHTML='<a data-presentation-attribution style="font-family:Times New Roman">made by and-scene</a>'
  expect(diagnose().join(' ')).toContain('unpolished attribution')
  const a = document.querySelector('a')!; a.style.fontFamily='sans-serif'; a.style.fontSize='9px'
  expect(diagnose().join(' ')).toContain('[data-presentation-attribution]')
  a.style.fontSize='14px'; expect(diagnose()).toEqual([])
  a.style.color='rgb(0, 0, 238)'; expect(diagnose().join(' ')).toContain('unpolished')
})
test('I-37 visibly distinct active chrome and locally polished attribution clear warnings', () => {
  setup('<button data-x="100" data-presentation-progress-step data-presentation-active="true" style="background:#bcefaa;font-weight:700">1</button><button data-x="200" data-presentation-progress-step data-presentation-active="false">2</button><a data-x="300" data-presentation-attribution>made by and-scene</a>')
  expect(diagnose()).toEqual([])
})
