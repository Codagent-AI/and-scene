// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { collectDiagnostics } from '../inspection-diagnostics.mjs'

function fixture(allowOverlap = false) {
  document.body.innerHTML = `<main><div data-presentation-stage-region><span id="text" data-inspect-text>diagram label</span>${allowOverlap ? '<span data-presentation-allow-overlap><span id="allowed" data-inspect-text>intentional</span></span>' : ''}</div><div id="chrome" data-inspect-chrome>footer control</div><nav data-presentation-progress><button id="active" data-active="true" aria-current="step">1</button><button id="inactive">2</button></nav><a data-presentation-attribution href="#">credit</a></main>`
  const rect = (left: number, top: number, width: number, height: number) => ({ x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) })
  for (const element of document.querySelectorAll('*')) element.getBoundingClientRect = () => rect(400, 500, 20, 20)
  document.querySelector('#text')!.getBoundingClientRect = () => rect(10, 10, 100, 20)
  document.querySelector('#chrome')!.getBoundingClientRect = () => rect(50, 10, 100, 30)
  document.querySelector('#active')!.setAttribute('style', 'color: red; background: yellow; font-weight: bold')
  document.querySelector('#inactive')!.setAttribute('style', 'color: blue; background: black; font-weight: normal')
  document.querySelector('[data-presentation-attribution]')!.setAttribute('style', 'font-size: 10px; font-family: Times New Roman')
}

describe('inspection diagnostics', () => {
  beforeEach(() => fixture())
  it('warns about visible unmarked overlap and unpolished attribution', () => {
    const warnings = collectDiagnostics(document)
    expect(warnings.some((warning) => warning.includes('diagram label') && warning.includes('footer control'))).toBe(true)
    expect(warnings).toContain('Attribution may be undersized or browser-default styled; use the data-presentation-attribution hook')
  })
  it('does not warn about text inside an explicit overlap allowance', () => {
    fixture(true)
    const warnings = collectDiagnostics(document)
    expect(warnings.some((warning) => warning.includes('intentional'))).toBe(false)
  })
  it('warns when active navigation looks the same as its peers', () => {
    document.querySelector('#inactive')!.setAttribute('style', 'color: red; background: yellow; font-weight: bold')
    expect(collectDiagnostics(document).some((warning) => warning.toLowerCase().includes('active progress indicator'))).toBe(true)
  })
})
