import { it, expect, beforeEach, afterEach, vi } from 'vitest'
import { visualDiagnostics } from '../scripts/visual-diagnostics.mjs'
afterEach(() => vi.restoreAllMocks())
function rectangle(el: Element) { const x = Number(el.getAttribute('data-x') ?? 0), y = Number(el.getAttribute('data-y') ?? 0); return new DOMRect(x, y, 100, 20) }
beforeEach(() => {
  document.body.innerHTML = '<main data-presentation-root></main>'
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) { return rectangle(this) })
  vi.spyOn(Range.prototype, 'selectNodeContents').mockImplementation(function (this: Range, node: Node) { Object.assign(this, { testNode: node }) })
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: function (this: { testNode: Node }) { return [rectangle(this.testNode.parentElement!)] } })
})
function html(content: string) { document.querySelector('main')!.innerHTML = content }
it('I-42 text and chrome collisions, hidden text and subtree exemptions', () => {
  html('<span style="opacity:1">Alpha</span><span style="opacity:1">Beta</span>')
  expect(visualDiagnostics()).toContain('overlap: Alpha / Beta')
  html('<span style="opacity:1">Alpha</span><div data-presentation-allow-overlap><span style="opacity:1">Beta</span></div>')
  expect(visualDiagnostics().some((s: string) => s.startsWith('overlap:'))).toBe(false)
  html('<span style="display:none;opacity:1">Hidden</span><span style="opacity:1">Beta</span>')
  expect(visualDiagnostics().some((s: string) => s.includes('Hidden'))).toBe(false)
  html('<span style="opacity:1">Alpha</span><button style="opacity:1" aria-label="Chrome"></button>')
  expect(visualDiagnostics()).toContain('overlap: Alpha / Chrome')
})
it('I-43 active chrome signature warnings for progress and contents', () => {
  for (const hook of ['progress-entry', 'toc-entry']) {
    html(`<button data-presentation-${hook} data-presentation-active="true" style="opacity:1">Active</button><button data-presentation-${hook} style="opacity:1" data-x="200">Inactive</button>`)
    expect(visualDiagnostics()).toContain(`indistinct active chrome: ${hook} Active`)
    ;(document.querySelector('button') as HTMLElement).style.backgroundColor = 'green'
    expect(visualDiagnostics().some((s: string) => s.startsWith('indistinct'))).toBe(false)
  }
})
it('I-44 absent, default, small and locally styled attribution', () => {
  expect(visualDiagnostics()).toContain('missing attribution: style [data-presentation-attribution]')
  for (const style of ['font-size:10px', 'font-size:14px;color:rgb(0,0,238);text-decoration-line:underline']) {
    html(`<a data-presentation-attribution style="opacity:1;${style}">made by and-scene</a>`)
    expect(visualDiagnostics()).toContain('unpolished attribution: style [data-presentation-attribution]')
  }
  html('<a data-presentation-attribution style="opacity:1;font-size:12px;color:green;text-decoration:none">made by and-scene</a>')
  expect(visualDiagnostics()).toEqual([])
})
it('I-42 overlapping icon-only controls warn, separated and allowed controls do not', () => {
  const icon = '<svg aria-hidden="true"><path d="M0 0L10 10"/></svg>'
  html(`<button style="opacity:1" aria-label="Previous icon">${icon}</button><button style="opacity:1" aria-label="Next icon">${icon}</button>`)
  expect(visualDiagnostics()).toContain('overlap: Previous icon / Next icon')
  document.querySelectorAll('button')[1].setAttribute('data-x', '200')
  expect(visualDiagnostics().some((s: string) => s.startsWith('overlap:'))).toBe(false)
  html(`<button style="opacity:1" aria-label="Previous icon">${icon}</button><div data-presentation-allow-overlap><button style="opacity:1" aria-label="Next icon">${icon}</button></div>`)
  expect(visualDiagnostics().some((s: string) => s.startsWith('overlap:'))).toBe(false)
})
it('I-43 unpainted borders and outlines do not distinguish active controls', () => {
  for (const hook of ['progress-entry', 'toc-entry']) for (const treatment of ['border-style:none;border-width:2px', 'border-style:solid;border-width:0', 'border:2px solid transparent']) {
    html(`<button data-presentation-${hook} data-presentation-active="true" style="opacity:1;${treatment};outline:0 none red">Active</button><button data-presentation-${hook} style="opacity:1;${treatment};outline:0 none blue" data-x="200">Inactive</button>`)
    const active = document.querySelector('button') as HTMLElement
    const inactive = document.querySelectorAll('button')[1] as HTMLElement
    // Distinct colors on an invisible border must not suppress the advisory.
    if (!treatment.includes('transparent')) { active.style.borderColor = 'red'; inactive.style.borderColor = 'blue' }
    expect(visualDiagnostics()).toContain(`indistinct active chrome: ${hook} Active`)
    active.style.border = '2px solid red'
    expect(visualDiagnostics().some((s: string) => s.startsWith('indistinct'))).toBe(false)
    active.style.border = '0 none red'; inactive.style.border = '0 none blue'
    active.style.outline = '2px solid red'
    expect(visualDiagnostics().some((s: string) => s.startsWith('indistinct'))).toBe(false)
  }
})
