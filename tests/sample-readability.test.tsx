import { afterEach, beforeEach, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import Talk from '../src/presentations/how-to-make-a-presentation/Talk'
import { SAMPLE_WIDTH, SAMPLE_HEIGHT } from '../src/presentations/how-to-make-a-presentation/entities'
const css = document.createElement('style')
const primary = ['you strong', 'prompt span', 'question span', 'card1 strong', 'card1 .card-parts > span', 'card2 strong', 'card2 .card-parts > span', 'card3 strong', 'card3 .card-parts > span', 'depth span', 'kit span', 'verify strong', 'verify span', 'modify > span', 'reveal span']
const selectors = primary.map(selector => { const [name, ...rest] = selector.split(' '); return `[data-scene-name="${name}"] ${rest.join(' ')}` }).join(',')
function fontSize(element: Element): number {
  for (let e: Element | null = element; e; e = e.parentElement) {
    const size = parseFloat(getComputedStyle(e).fontSize)
    if (Number.isFinite(size)) return size
  }
  throw new Error(`No font size for ${element.textContent}`)
}
beforeEach(() => {
  css.textContent = readFileSync(path.resolve('src/presentations/how-to-make-a-presentation/style.css'), 'utf8')
  document.head.append(css)
  window.innerWidth = 390; window.innerHeight = 844
})
afterEach(() => { css.remove(); window.innerWidth = 1440; window.innerHeight = 900 })
it('A-001 first dense and final scenes retain readable labels on a uniformly fitted fixed canvas', () => {
  render(<Talk />)
  const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!
  expect(canvas.style.width).toBe(`${SAMPLE_WIDTH}px`)
  expect(canvas.style.height).toBe(`${SAMPLE_HEIGHT}px`)
  const scale = Number(canvas.style.transform.match(/scale\(([^)]+)\)/)?.[1])
  expect(SAMPLE_WIDTH * scale).toBeLessThanOrEqual(342)
  expect(SAMPLE_HEIGHT * scale).toBeLessThanOrEqual(844 - 110 - 185)
  for (const step of [1, 5, 9]) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Step ${step}:`) }))
    const labels = [...canvas.querySelectorAll(selectors)]
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) expect(fontSize(label) * scale, `${step}: ${label.textContent}`).toBeGreaterThanOrEqual(12)
    for (const label of canvas.querySelectorAll('small,.morph-label')) expect(fontSize(label) * scale, label.textContent ?? '').toBeGreaterThanOrEqual(11)
  }
  const entities = [...canvas.querySelectorAll<HTMLElement>('[data-scene-name]')]
  const geometry = entities.map(e => [e.style.left, e.style.top, e.style.width, e.style.height])
  act(() => { window.innerWidth = 1440; window.innerHeight = 900; window.dispatchEvent(new Event('resize')) })
  expect([...canvas.querySelectorAll('[data-scene-name]')]).toEqual(entities)
  expect(entities.map(e => [e.style.left, e.style.top, e.style.width, e.style.height])).toEqual(geometry)
  expect(canvas.style.width).toBe(`${SAMPLE_WIDTH}px`)
  expect(canvas.style.height).toBe(`${SAMPLE_HEIGHT}px`)
})
