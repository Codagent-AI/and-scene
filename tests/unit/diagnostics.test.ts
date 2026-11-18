import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { collectDiagnostics } from '../../scripts/diagnostics.mjs'
beforeEach(() => {
  document.body.innerHTML = '<div data-presentation=""><span id="a" style="opacity:1">alpha</span><span id="b" style="opacity:1">beta</span></div>'
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({ x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20, toJSON: () => ({}) }))
  vi.spyOn(document, 'createRange').mockImplementation(() => ({ selectNodeContents: () => {}, getClientRects: () => [{ left: 0, right: 100, top: 0, bottom: 20 }] }) as unknown as Range)
})
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })
it('I-41 reports unmarked text collisions and honors explicit subtree exemptions and hidden text', () => {
  expect(collectDiagnostics().join('\n')).toContain('overlap: alpha / beta')
  // An icon-only control still collides even without a text range.
  document.getElementById('b')!.outerHTML = '<button id="b" aria-label="icon control" style="opacity:1"></button>'
  expect(collectDiagnostics().join('\n')).toContain('overlap: alpha / icon control')
  document.getElementById('a')!.setAttribute('data-presentation-allow-overlap', '')
  expect(collectDiagnostics().join('\n')).not.toContain('overlap:')
  document.getElementById('a')!.removeAttribute('data-presentation-allow-overlap'); document.getElementById('a')!.style.visibility = 'hidden'
  expect(collectDiagnostics().join('\n')).not.toContain('overlap:')
})
it('I-42 warns for missing default or undersized attribution and indistinct active controls only', () => {
  expect(collectDiagnostics().join('\n')).toContain('missing attribution')
  document.body.innerHTML = '<div data-presentation=""><div data-presentation-attribution><a href="https://example.com" style="opacity:1;color:rgb(0,0,238);text-decoration-line:underline;font-size:16px">made by</a></div><nav data-presentation-progress><button style="opacity:1" data-presentation-active="true">1</button><button style="opacity:1" data-presentation-active="false">2</button></nav></div>'
  expect(collectDiagnostics().join('\n')).toContain('unpolished attribution'); expect(collectDiagnostics().join('\n')).toContain('indistinct active progress')
  const a = document.querySelector('a')!; a.style.color = '#333'; a.style.textDecorationLine = 'none'; a.style.fontSize = '8px'
  expect(collectDiagnostics().join('\n')).toContain('unpolished attribution'); a.style.fontSize = '14px'
  document.querySelector('button')!.style.backgroundColor = 'green'
  expect(collectDiagnostics().join('\n')).not.toContain('attribution'); expect(collectDiagnostics().join('\n')).not.toContain('indistinct active')
})
