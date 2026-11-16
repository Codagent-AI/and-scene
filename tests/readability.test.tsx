import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { Presentation } from '../src/presentation-kit'
import { fitGeometry } from '../src/presentation-kit/useFitScale'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { sceneState } from '../src/presentations/how-to-make-a-presentation/entities'
import { readFileSync } from 'node:fs'
const css = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
import type { Mode } from '../src/presentation-kit'

let sheet: HTMLStyleElement
beforeEach(() => { sheet = document.createElement('style'); sheet.textContent = css; document.head.append(sheet) })
afterEach(() => { sheet.remove() })
const viewports = [[390, 844], [844, 390], [390, 390], [1440, 900]] as const
for (const [width, height] of viewports) for (const mode of ['browse', 'present'] as const) {
  it(`F-001 keeps first dense and final diagram text readable at ${width}x${height} in ${mode}`, () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
    const view = render(<div className="how-to"><Presentation steps={STEPS} title="Readability" initialMode={mode} /></div>)
    const fit = fitGeometry(width, height, mode)
    expect(fit.height + fit.layout.header + fit.layout.footer).toBe(height)
    expect(fit.scale * 880).toBeLessThanOrEqual(width - fit.inset)
    expect(fit.scale * 380).toBeLessThanOrEqual(fit.height)
    let index = 0
    for (const target of [0, 4, 8]) {
      while (index < target) { fireEvent.keyDown(window, { key: 'ArrowRight' }); index++ }
      expect(view.container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe(String(target))
      for (const text of view.container.querySelectorAll<HTMLElement>('[data-presentation-node] span, [data-presentation-node] small')) {
        const size = parseFloat(getComputedStyle(text).fontSize)
        expect(size * fit.scale, `${text.textContent} effective font size`).toBeGreaterThanOrEqual(11)
      }
      const canvas = view.container.querySelector<HTMLElement>('[data-presentation-canvas]')!
      expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
      expect(canvas.style.transform).toMatch(/^scale\([0-9.]+\)$/)
      expect(Number(canvas.style.transform.slice(6, -1))).toBeCloseTo(fit.scale, 5)
      expect(view.container.querySelector<HTMLElement>('[data-presentation-header]')!.parentElement!.style.height).toBe(`${fit.layout.header}px`)
      expect(view.container.querySelector<HTMLElement>('[data-presentation-footer-slot]')!.style.minHeight).toBe(`${fit.layout.footer}px`)
    }
  })
}
it('F-001 changes chrome reservations on resize without changing the scene composition', () => {
  const mode: Mode = 'browse'
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })
  const view = render(<div className="how-to"><Presentation steps={STEPS} title="Resize" initialMode={mode} /></div>)
  for (let i = 0; i < 4; i++) fireEvent.keyDown(window, { key: 'ArrowRight' })
  const before = [...view.container.querySelectorAll<HTMLElement>('[data-presentation-entity]')].map(node => ({ id: node.dataset.presentationEntity, left: node.style.left, top: node.style.top, width: node.style.width, height: node.style.height }))
  const normal = fitGeometry(844, 844, mode)
  act(() => { Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 }); window.dispatchEvent(new Event('resize')) })
  expect(view.container.querySelector('[data-presentation-compact]')?.getAttribute('data-presentation-compact')).toBe('true')
  expect(view.container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('4')
  const after = [...view.container.querySelectorAll<HTMLElement>('[data-presentation-entity]')].map(node => ({ id: node.dataset.presentationEntity, left: node.style.left, top: node.style.top, width: node.style.width, height: node.style.height }))
  expect(after).toEqual(before)
  const compact = fitGeometry(844, 390, mode)
  expect(compact.layout.header + compact.layout.footer).toBeLessThan(normal.layout.header + normal.layout.footer)
  expect(compact.scale).toBeGreaterThanOrEqual(11 / 27)
  const original = sceneState(4)
  expect(sceneState(9).filter(node => original.some(previous => previous.id === node.id))).toEqual(original)
})
