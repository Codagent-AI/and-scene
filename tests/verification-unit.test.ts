import { afterEach, describe, expect, it, vi } from 'vitest'
import { REFERENCE_STEPS, validateReference } from '../scripts/reference.mjs'
import { parseOptions } from '../scripts/browser-runtime.mjs'
import { visualDiagnostics } from '../scripts/diagnostics.mjs'

describe('reference validation', () => {
  it('accepts the complete canonical outline', () => expect(() => validateReference(REFERENCE_STEPS)).not.toThrow())
  it('rejects missing, reordered, altered titles/captions/eras', () => {
    expect(() => validateReference(REFERENCE_STEPS.slice(1))).toThrow('expected 9')
    const reordered = [...REFERENCE_STEPS]
    ;[reordered[0], reordered[1]] = [reordered[1], reordered[0]]
    expect(() => validateReference(reordered)).toThrow('step 0')
    for (let field = 0; field < 3; field++) {
      const altered = REFERENCE_STEPS.map((step) => [...step])
      altered[3][field] = 'wrong'
      expect(() => validateReference(altered)).toThrow(`sample step 3: ${['era', 'title', 'caption'][field]}`)
    }
  })
})

describe('verification arguments', () => {
  it('accepts positional and explicit slugs and viewport/settling options', () => {
    expect(parseOptions(['example']).slug).toBe('example')
    expect(parseOptions(['--slug', 'example', '--width', '390', '--height', '844', '--settle', '700'])).toEqual({ slug: 'example', width: 390, height: 844, settle: 700 })
  })
  it('rejects missing, unknown, escaping, and invalid numeric arguments', () => {
    for (const args of [['--slug'], ['--unknown'], ['../secret'], ['--width', 'NaN'], ['--settle', '-1'], ['--height', '0']]) expect(() => parseOptions(args)).toThrow('arguments:')
  })
})

describe('diagnostic classification', () => {
  afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })
  it('reports missing attribution and skips allowed and invisible text', () => {
    document.body.innerHTML = '<div data-presentation-allow-overlap><span>intentional</span><span>overlap</span></div><span style="display:none">hidden</span>'
    expect(visualDiagnostics()).toEqual(['attribution missing: style [data-presentation-attribution]'])
  })
  it('classifies undersized and browser-default attribution separately from locally styled attribution', () => {
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([new DOMRect(0, 0, 20, 20)] as unknown as DOMRectList)
    for (const style of ['font:8px Arial;color:rgb(50,50,50)', 'font:16px Arial;color:rgb(0,0,238)', 'font:16px "Times New Roman";color:rgb(50,50,50)']) {
      document.body.innerHTML = `<a data-presentation-attribution style='${style}'></a>`
      expect(visualDiagnostics()).toContain('attribution undersized or browser-default: style [data-presentation-attribution]')
    }
    document.body.innerHTML = '<a data-presentation-attribution style="font:14px Arial;color:rgb(50,50,50)"></a>'
    expect(visualDiagnostics()).toEqual([])
  })
  it('reports indistinct progress and table of contents but accepts a distinct active style', () => {
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([new DOMRect(0, 0, 20, 20)] as unknown as DOMRectList)
    document.body.innerHTML = '<nav data-presentation-progress><button aria-current="step"></button><button></button></nav><nav data-presentation-toc><button data-presentation-active="true"></button><button></button></nav>'
    expect(visualDiagnostics().filter((warning) => warning.startsWith('indistinct'))).toHaveLength(2)
    document.querySelectorAll('button:first-child').forEach((element) => element.setAttribute('style', 'font-weight:700;color:rgb(10,40,60)'))
    expect(visualDiagnostics().filter((warning) => warning.startsWith('indistinct'))).toHaveLength(0)
  })
  it('detects text collisions while exempting explicitly marked subtrees and hidden elements', () => {
    const rect = new DOMRect(0, 0, 100, 20)
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([rect] as unknown as DOMRectList)
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) { return this.tagName === 'A' ? new DOMRect(500, 500, 100, 20) : rect })
    vi.spyOn(document, 'createRange').mockImplementation(() => ({ selectNodeContents() {}, getClientRects: () => [rect] }) as unknown as Range)
    document.body.innerHTML = '<span data-testid="collision-a">alpha</span><span data-testid="collision-b">beta</span><div data-presentation-allow-overlap><span data-testid="allowed-a">gamma</span><span data-testid="allowed-b">delta</span></div><span style="visibility:hidden" data-testid="hidden">hidden</span><div style="opacity:0"><span data-testid="hidden-opacity">transparent ancestor</span></div><div style="display:none"><span data-testid="hidden-display">absent ancestor</span></div><a data-presentation-attribution style="font:14px Arial;color:rgb(50,50,50)"></a>'
    expect(visualDiagnostics()).toEqual(['overlap: collision-a / collision-b'])
    document.querySelector('[data-presentation-allow-overlap]')?.removeAttribute('data-presentation-allow-overlap')
    expect(visualDiagnostics().join('\n')).toContain('allowed-a / allowed-b')
    expect(visualDiagnostics().join('\n')).not.toContain('hidden')
  })
  it('recognizes font size and border style as active-state distinctions', () => {
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([new DOMRect(0, 0, 20, 20)] as unknown as DOMRectList)
    for (const style of ['font-size:20px', 'border-style:dashed']) {
      document.body.innerHTML = `<nav data-presentation-progress><button aria-current="step" style="${style}"></button><button></button></nav>`
      expect(visualDiagnostics().filter((warning) => warning.startsWith('indistinct'))).toHaveLength(0)
    }
  })
})
