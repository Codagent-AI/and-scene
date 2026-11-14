import { afterEach, describe, it, expect, vi } from 'vitest'
import { visualDiagnostics } from '../../scripts/diagnostics.mjs'
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })
function setup(content: string) {
  document.body.innerHTML = `<main data-presentation-root data-step-index="3">${content}</main>`
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function(this: Element) {
    const x = Number(this.getAttribute('data-x') ?? 0)
    return { x, y: 0, left: x, top: 0, right: x + 20, bottom: 20, width: 20, height: 20, toJSON() {} }
  })
  Range.prototype.getClientRects = function() { return [this.startContainer.parentElement!.getBoundingClientRect()] as unknown as DOMRectList }
  // jsdom computes an empty default opacity; normalize it to real browser defaults.
  const original = window.getComputedStyle
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const s = original(element, pseudo)
    return new Proxy(s, { get(target, key) { return key === 'opacity' && !target.opacity ? '1' : Reflect.get(target, key) } })
  })
}
describe('visual diagnostic logic', () => {
  it('I-53 reports unmarked collisions but exempts marked and hidden subtrees', () => {
    setup('<span>alpha</span><span>beta</span><div data-presentation-allow-overlap="true"><span>allowed</span></div><div style="display:none"><span>hidden</span></div>')
    const warnings = visualDiagnostics().join('\n')
    expect(warnings).toContain('step 3: overlap: alpha / beta')
    expect(warnings).not.toMatch(/allowed|hidden/)
  })
  it('I-54 warns for identical active chrome and accepts distinct local styling', () => {
    setup('<button data-presentation-progress-step data-presentation-active="true">1</button><button data-x="30" data-presentation-progress-step data-presentation-active="false">2</button>')
    expect(visualDiagnostics().join('\n')).toContain('indistinct active progress-step')
    document.querySelector('button')!.style.backgroundColor = 'red'
    expect(visualDiagnostics().join('\n')).not.toContain('indistinct')
  })
  it('I-55 diagnoses missing small and browser-default credit and accepts legible custom credit', () => {
    setup('')
    expect(visualDiagnostics().join('\n')).toContain('missing attribution')
    document.querySelector('main')!.innerHTML = '<a data-presentation-attribution style="font:8px sans-serif;color:rgb(90,100,90)">credit</a>'
    expect(visualDiagnostics().join('\n')).toContain('unpolished attribution')
    const link = document.querySelector('a')!
    link.style.fontSize = '14px'; link.style.color = 'rgb(0,0,238)'
    expect(visualDiagnostics().join('\n')).toContain('unpolished attribution')
    link.style.color = 'rgb(90,100,90)'
    expect(visualDiagnostics()).toEqual([])
  })
})
