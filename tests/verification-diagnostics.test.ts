import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectDiagnostics } from '../scripts/diagnostics.mjs'

const rect = { x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20, toJSON() {} }
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })
function geometry() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => rect })
}
describe('inspection advisory classification', () => {
  it('reports visible unmarked collisions with the elements named', () => {
    document.body.innerHTML = '<span>first</span><span>second</span>'
    geometry()
    expect(collectDiagnostics().some((s: string) => s.includes('overlap: span[first] / span[second]'))).toBe(true)
  })
  it('suppresses overlap in explicitly allowed subtrees and ignores hidden text', () => {
    document.body.innerHTML = '<div data-presentation-allow-overlap><span>first</span><span>second</span></div><span style="display:none">hidden</span>'
    geometry()
    expect(collectDiagnostics().filter((s: string) => s.startsWith('overlap:'))).toEqual([])
  })
  it('warns for indistinct active chrome and stops warning when styled distinctly', () => {
    document.body.innerHTML = '<nav data-presentation-progress><button aria-current="step">first</button><button>second</button></nav>'
    geometry()
    expect(collectDiagnostics().some((s: string) => s.includes('active navigation indistinct'))).toBe(true)
    document.querySelector('button')!.style.fontWeight = '700'
    expect(collectDiagnostics().some((s: string) => s.includes('active navigation indistinct'))).toBe(false)
  })
  it.each(['', '<a data-presentation-attribution style="font-size:8px">made by and-scene</a>', '<a data-presentation-attribution style="font-size:14px;color:rgb(0,0,238);text-decoration-line:underline">made by and-scene</a>'])('warns for missing, undersized, or browser-default attribution %#', (html) => {
    document.body.innerHTML = html
    geometry()
    expect(collectDiagnostics().some((s: string) => s.includes('attribution') && s.includes('[data-presentation-attribution]'))).toBe(true)
  })
  it('accepts locally polished attribution without warnings', () => {
    document.body.innerHTML = '<a data-presentation-attribution style="font-size:14px;color:rgb(30,30,30);font-family:Arial;text-decoration-line:none">made by and-scene</a>'
    geometry()
    expect(collectDiagnostics()).toEqual([])
  })
})
