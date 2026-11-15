import { afterEach, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { SAMPLE_CANVAS, positions, cardPosition, morphPosition } from '../src/presentations/how-to-make-a-presentation/entities'
import { Story, STEPS } from '../src/presentations/how-to-make-a-presentation/steps/Story'
import Talk from '../src/presentations/how-to-make-a-presentation/Talk'
import { DESIGN_W, DESIGN_H } from '../src/presentation-kit/constants'
import { fitScale } from '../src/presentation-kit/useFitScale'
let stylesheet: HTMLStyleElement | undefined
afterEach(() => { stylesheet?.remove(); stylesheet = undefined })
function showStory(beat: number) {
  stylesheet = document.createElement('style')
  stylesheet.textContent = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
  document.head.append(stylesheet)
  return render(<div className="workshop"><Story payload={beat} /></div>)
}
test('F-1 sample has one compact fixed canvas while the kit retains its default dimensions', () => {
  expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  render(<Talk />)
  const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
  expect(canvas.style.width).toBe(`${SAMPLE_CANVAS.width}px`)
  expect(canvas.style.height).toBe(`${SAMPLE_CANVAS.height}px`)
  expect(SAMPLE_CANVAS).toEqual({ width: 400, height: 460 })
  for (const rect of [...Object.values(positions), ...[0,1,2].map(cardPosition), ...[0,1].map(morphPosition)]) {
    expect(rect.left).toBeGreaterThanOrEqual(0); expect(rect.top).toBeGreaterThanOrEqual(0)
    expect(rect.left + rect.width).toBeLessThanOrEqual(SAMPLE_CANVAS.width)
    expect(rect.top + rect.height).toBeLessThanOrEqual(SAMPLE_CANVAS.height)
  }
})
test('F-1 dense annotation CSS stays at least 12px after 390x844 fit in both modes', () => {
  showStory(9)
  const annotations = document.querySelectorAll('.prompt,.question,.card-number,.step-card strong,.step-card small,.morph small,.depth,.kit,.kit small,.verify strong,.verify small,.modify span,.edited,.reveal span')
  expect(annotations.length).toBeGreaterThan(15)
  for (const mode of ['browse','present'] as const) {
    const scale = fitScale(390, 844, mode, SAMPLE_CANVAS.width, SAMPLE_CANVAS.height)
    expect(scale).toBeCloseTo(.855)
    for (const annotation of annotations) expect(parseFloat(getComputedStyle(annotation).fontSize) * scale, annotation.className || annotation.textContent || '').toBeGreaterThanOrEqual(12)
  }
  // The three card-part labels remain explicit rather than shrinking into a single line.
  expect(screen.getAllByText('caption')).toHaveLength(3)
  expect(screen.getAllByText('visual')).toHaveLength(3)
})
test('F-1 corrected scene preserves canonical narration and constant entity coordinates between beats', () => {
  const { rerender } = showStory(1)
  const you = screen.getByText('you')
  const start = you.getAttribute('style')
  for (let beat=2;beat<=9;beat++) {
    rerender(<div className="workshop"><Story payload={beat} /></div>)
    expect(screen.getByText('you')).toBe(you)
    expect(you.getAttribute('style')).toBe(start)
  }
  expect(STEPS).toHaveLength(9)
  expect(positions.kit.top).toBe(positions.tray.top + positions.tray.height)
  expect(positions.verify.top).toBe(cardPosition(0).top)
  expect(document.querySelectorAll('.step-card')).toHaveLength(3)
})
test('F-2 two-way conversation connector is a bounded SVG strictly between both nodes', () => {
  showStory(6)
  const connector = document.querySelector('.conversation') as HTMLElement
  expect(connector.textContent).toBe('')
  expect(positions.conversation.left).toBeGreaterThan(positions.you.left + positions.you.width)
  expect(positions.conversation.left + positions.conversation.width).toBeLessThan(positions.skill.left)
  expect(positions.conversation.top).toBeGreaterThan(positions.you.top)
  expect(positions.conversation.top + positions.conversation.height).toBeLessThan(positions.you.top + positions.you.height)
  const svg = connector.querySelector('svg')!
  expect(svg.getAttribute('viewBox')).toBe(`0 0 ${positions.conversation.width} ${positions.conversation.height}`)
  expect(getComputedStyle(svg).overflow).toBe('hidden')
  expect(svg.getAttribute('width')).toBe('100%'); expect(svg.getAttribute('height')).toBe('100%')
  expect(svg.querySelector('path')!.getAttribute('d')).toContain('M2 12 H124')
})
