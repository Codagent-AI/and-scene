import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { entities } from '../src/presentations/how-to-make-a-presentation/entities'
import { DESIGN_H, DESIGN_W } from '../src/presentation-kit/constants'
import { fitScale, stageGeometry } from '../src/presentation-kit/useFitScale'
let stylesheet: HTMLStyleElement
beforeEach(() => {
  stylesheet = document.createElement('style')
  stylesheet.textContent = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
  document.head.append(stylesheet)
})
afterEach(() => { cleanup(); stylesheet.remove() })
function inheritedPixelSize(element: Element): number {
  for (let current: Element | null = element; current; current = current.parentElement) {
    const size = getComputedStyle(current).fontSize
    if (size.endsWith('px')) return parseFloat(size)
  }
  throw new Error(`No authored font size for ${element.textContent}`)
}
it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('F-1 all scene text in beat %i retains a 12px font floor at 390x844', beat => {
  const { container } = render(<div className="skill-story"><Scene payload={{ beat }} /></div>)
  for (const mode of ['browse', 'present'] as const) {
    const stage = stageGeometry(390, 844, mode)
    const scale = fitScale(stage.width, stage.height)
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    let count = 0
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent?.trim()) continue
      const element = walker.currentNode.parentElement!
      expect(inheritedPixelSize(element) * scale, `${mode}: ${element.textContent}`).toBeGreaterThanOrEqual(12)
      count++
    }
    expect(count).toBeGreaterThan(0)
  }
})
it('F-1 all entity geometry fits the unchanged 880x380 design canvas', () => {
  expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  for (const entity of entities) {
    expect(entity.x, entity.id).toBeGreaterThanOrEqual(0)
    expect(entity.y, entity.id).toBeGreaterThanOrEqual(0)
    expect(entity.x + entity.w, entity.id).toBeLessThanOrEqual(DESIGN_W)
    expect(entity.y + entity.h, entity.id).toBeLessThanOrEqual(DESIGN_H)
  }
})
it('F-1 card fields occupy separate readable lines inside their card height', () => {
  const { container } = render(<div className="skill-story"><Scene payload={{ beat: 9 }} /></div>)
  for (const entity of entities.filter(entity => entity.id.startsWith('card-'))) {
    const card = container.querySelector(`[data-entity="${entity.id}"]`)!
    expect([...card.children].map(child => child.textContent)).toEqual(['title', 'caption', 'visual'])
    let totalHeight = 0
    for (const child of card.children) {
      let lineHeight = getComputedStyle(child).lineHeight
      if (!parseFloat(lineHeight)) lineHeight = getComputedStyle(card).lineHeight
      const value = parseFloat(lineHeight)
      totalHeight += lineHeight.endsWith('px') ? value : value * inheritedPixelSize(child)
    }
    expect(totalHeight, entity.id).toBeLessThanOrEqual(entity.h - 2)
  }
})
it('F-1 larger labels preserve entity DOM identity and coordinates through every beat', () => {
  const { container, rerender } = render(<div className="skill-story"><Scene payload={{ beat: 1 }} /></div>)
  const previous = new Map<string, { node: Element; geometry: string | null }>()
  for (let beat = 1; beat <= 9; beat++) {
    rerender(<div className="skill-story"><Scene payload={{ beat }} /></div>)
    for (const node of container.querySelectorAll('[data-entity]')) {
      const id = node.getAttribute('data-entity')!
      const old = previous.get(id)
      const geometry = ['left', 'top', 'width', 'height'].map(property => node.parentElement!.style.getPropertyValue(property)).join(';')
      if (old) {
        expect(node, id).toBe(old.node)
        expect(geometry, id).toBe(old.geometry)
      }
      previous.set(id, { node, geometry })
    }
  }
  expect(previous.size).toBe(entities.length)
})
