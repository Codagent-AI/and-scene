import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import Talk from '../src/presentations/how-to-make-a-presentation/Talk'
import { compactCopy } from '../src/presentations/how-to-make-a-presentation/compact'
import { entities } from '../src/presentations/how-to-make-a-presentation/entities'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, STAGE_LAYOUT } from '../src/presentation-kit/constants'

it('F-001 compact entity labels budget at least 11 screen pixels at 390x844 in both modes', () => {
  const { container } = render(<Talk />)
  for (let beat = 1; beat < 9; beat++) act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
  for (const entity of entities.filter(e => !['tray', 'conversation'].includes(e.id))) {
    const node = container.querySelector(`[data-entity-id="${entity.id}"]`)!
    const label = node.querySelector<HTMLElement>('.entity-label-compact')!
    expect(label, `${entity.id} needs readable compact copy`).toBeTruthy()
    for (const mode of ['browse', 'present'] as const) {
      expect(parseFloat(label.style.fontSize) * fitScale(390, 844, mode), `${entity.id} in ${mode}`).toBeGreaterThanOrEqual(11)
    }
    for (const detail of node.querySelectorAll<HTMLElement>('.entity-detail-compact')) {
      expect(parseFloat(detail.style.fontSize) * fitScale(390, 844, 'browse')).toBeGreaterThanOrEqual(11)
    }
  }
})
it('F-001 compact card anatomy has a readable key and full accessible meaning', () => {
  const { container } = render(<Talk />)
  for (let beat = 1; beat < 9; beat++) act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
  const key = screen.getByLabelText('Diagram key')
  for (const term of ['T title', 'C caption', 'V visual', 'P partial', 'F full', '→ morph', '✎ edited', '✓ build / render']) expect(key.textContent).toContain(term)
  expect(compactCopy['card-1'].detail).toBe('T C V')
  expect(screen.getByRole('img', { name: '01 / the idea. title · caption · visual' })).toBeTruthy()
  expect(screen.getByRole('img', { name: /^✓ verify\. build ✓\s+render ✓$/ })).toBeTruthy()
  expect(screen.getByRole('img', { name: 'Two-way conversation between you and skill' })).toBeTruthy()
  for (const entity of entities) {
    const node = container.querySelector(`[data-entity-id="${entity.id}"]`)!
    expect(node.querySelector('.entity-label-full')?.textContent).toBe(entity.label)
    const placed = node.parentElement!
    expect([placed.style.left, placed.style.top, placed.style.width, placed.style.height]).toEqual([`${entity.x}px`, `${entity.y}px`, `${entity.width}px`, `${entity.height}px`])
  }
})

it('F-002 readable key stays above the fitted browse canvas in short viewports', () => {
  window.innerWidth = 390
  window.innerHeight = 540
  const { container } = render(<Talk />)
  for (let beat = 1; beat < 9; beat++) act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
  expect(container.querySelector('[data-entity-id="reveal"]')).toBeTruthy()
  const canvas = container.querySelector<HTMLElement>('[data-presentation-canvas]')!
  const key = screen.getByLabelText('Diagram key')
  const fontSize = parseFloat(key.style.fontSize)
  const lineHeight = parseFloat(key.style.lineHeight)
  expect(fontSize).toBeGreaterThanOrEqual(12)
  expect(lineHeight).toBeGreaterThanOrEqual(fontSize)
  const keyBottom = parseFloat(key.style.top) + key.children.length * lineHeight
  const layout = STAGE_LAYOUT.browse
  expect(keyBottom).toBeLessThanOrEqual(layout.top)
  for (const height of [440, 450, 500, 540, 844]) {
    act(() => { window.innerHeight = height; fireEvent.resize(window) })
    const scale = fitScale(390, height, 'browse')
    const renderedScale = Number(canvas.style.transform.match(/^scale\(([^)]+)\)$/)?.[1])
    expect(renderedScale).toBeCloseTo(scale, 5)
    const canvasTop = layout.top + (height - layout.top - layout.bottom - DESIGN_H * scale) / 2
    expect(keyBottom, `key must clear the canvas at height ${height}`).toBeLessThanOrEqual(canvasTop + 0.001)
    const reveal = entities.find(entity => entity.id === 'reveal')!
    expect(keyBottom).toBeLessThan(canvasTop + reveal.y * scale)
  }
})
