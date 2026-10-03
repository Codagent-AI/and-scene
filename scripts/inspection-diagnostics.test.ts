// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { collectVisualWarnings } from './inspection-diagnostics.mjs'

function rect(left: number, top: number, right: number, bottom: number) {
  return { left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) }
}

describe('inspection diagnostics', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <header data-presentation-header>header</header>
      <div data-scene-node="box" id="first">first</div>
      <div data-scene-node="box" id="second">second</div>
      <button data-presentation-progress-item aria-current="step">1</button>
      <button data-presentation-progress-item>2</button>
      <div data-presentation-attribution style="font-size: 8px"><a href="#">made by and-scene</a></div>
    `
    Object.defineProperty(document.querySelector('#first'), 'getBoundingClientRect', { value: () => rect(0, 0, 40, 40) })
    Object.defineProperty(document.querySelector('#second'), 'getBoundingClientRect', { value: () => rect(20, 20, 60, 60) })
    for (const element of document.querySelectorAll('[data-presentation-header], [data-scene-node], [data-presentation-progress-item], [data-presentation-attribution], a')) {
      if (element.id === 'first' || element.id === 'second') continue
      const top = element.matches('[data-presentation-header]') ? 100 : element.matches('[data-presentation-progress-item]') ? 150 : 200
      Object.defineProperty(element, 'getBoundingClientRect', { value: () => rect(0, top, 40, top + 40) })
    }
  })

  it('reports collisions, indistinct active chrome, and attribution polish defects', () => {
    const warnings = collectVisualWarnings(document)

    expect(warnings).toContainEqual(expect.stringContaining('text/chrome overlap'))
    expect(warnings).toContain('active navigation may be visually indistinct')
    expect(warnings).toContain('attribution is undersized; style [data-presentation-attribution] locally')
    expect(warnings).toContain('attribution still looks browser-default; style [data-presentation-attribution] locally')
  })

  it('ignores collisions inside an explicit allow-overlap subtree', () => {
    document.querySelector('#first')?.setAttribute('data-presentation-allow-overlap', '')
    const warnings = collectVisualWarnings(document)

    expect(warnings.some((warning) => warning.includes('text/chrome overlap'))).toBe(false)
  })
})
