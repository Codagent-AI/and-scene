import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { steps } from '../src/presentations/how-to-make-a-presentation/steps'
import { entity, cardPosition, positions } from '../src/presentations/how-to-make-a-presentation/entities'
import { presentations, findPresentation } from '../src/presentations'
import { Router } from '../src/Router'
import { reference, validateReference } from '../scripts/reference.mjs'

const css = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
const node = (container: HTMLElement, name: string) => container.querySelector<HTMLElement>(`[data-entity-id="${entity(name)}"]`)
it('I-8 registry links multiple routes and handles unknown paths', () => {
  presentations.push({ slug: 'second', title: 'Second', load: presentations[0].load })
  try {
    render(<Router pathname="/unknown" />)
    expect(screen.getByRole('link', { name: /How to Use/ }).getAttribute('href')).toBe('/how-to-make-a-presentation')
    expect(screen.getByRole('link', { name: /Second/ }).getAttribute('href')).toBe('/second')
    expect(findPresentation('/second/')?.slug).toBe('second')
    expect(findPresentation('/how-to-make-a-presentation')?.load).toBe(presentations[0].load)
    expect(findPresentation('/absent')).toBeUndefined()
  } finally { presentations.pop() }
})
it('I-29 matches nine normative eras and metadata with stable accumulating coordinates', () => {
  expect(steps).toHaveLength(9)
  expect(() => validateReference(steps)).not.toThrow()
  const view = render(<Scene payload={{ beat: 1 }} />)
  const seen = new Map<string, { node: Element; style: string | null }>()
  for (let beat = 1; beat <= 9; beat++) {
    view.rerender(<Scene payload={{ beat }} />)
    for (const element of view.container.querySelectorAll('[data-entity-id]')) {
      const id = element.getAttribute('data-entity-id')!
      if (seen.has(id)) {
        expect(element).toBe(seen.get(id)!.node)
        expect(element.getAttribute('style')).toBe(seen.get(id)!.style)
      } else seen.set(id, { node: element, style: element.getAttribute('style') })
    }
    expect([...seen.keys()].every(id => view.container.querySelector(`[data-entity-id="${id}"]`))).toBe(true)
  }
})
it('I-30 introduces you prompt and a question over the two-way conversation', () => {
  const view = render(<Scene payload={{ beat: 1 }} />)
  expect(node(view.container, 'you')?.textContent).toBe('you')
  expect(node(view.container, 'prompt')?.textContent).toContain('topic')
  expect(node(view.container, 'skill')).toBeNull()
  view.rerender(<Scene payload={{ beat: 2 }} />)
  expect(node(view.container, 'skill')?.textContent).toBe('the skill')
  expect(node(view.container, 'conversation')?.textContent).toContain('←')
  expect(node(view.container, 'conversation')?.textContent).toContain('→')
  expect(positions.question.top).toBeLessThan(positions.conversation.top)
})
it('I-31 accumulates detailed cards with morphs on links and stable tray', () => {
  const view = render(<Scene payload={{ beat: 3 }} />)
  expect(node(view.container, 'tray')).toBeTruthy()
  expect(node(view.container, 'card-0')?.textContent).toContain('titlecaption · visual')
  expect(node(view.container, 'card-1')).toBeNull()
  const first = node(view.container, 'card-0')
  view.rerender(<Scene payload={{ beat: 4 }} />)
  expect(node(view.container, 'card-0')).toBe(first)
  expect(node(view.container, 'card-2')).toBeTruthy()
  expect(node(view.container, 'morph-0')?.textContent).toContain('morph')
  expect(first?.textContent).not.toContain('morph')
  expect(Number.parseInt(node(view.container, 'morph-0')!.style.left)).toBeGreaterThan(cardPosition(0).left + cardPosition(0).width)
})
it('I-32 docks the depth control on you and adds an unspecified ghost card', () => {
  const view = render(<div className="skill-presentation"><style>{css}</style><Scene payload={{ beat: 5 }} /></div>)
  expect(node(view.container, 'ghost')?.className).toBe('ghost node')
  expect(getComputedStyle(node(view.container, 'ghost')!).borderStyle).toBe('dashed')
  expect(node(view.container, 'depth')?.textContent).toBe('partial ↔ full')
  expect(positions.depth.left).toBe(positions.you.left)
  expect(positions.depth.top).toBeGreaterThan(positions.you.top + positions.you.height)
})
it('I-33 plugs shared kit into the tray bottom without adding a tray frame', () => {
  const view = render(<Scene payload={{ beat: 6 }} />)
  expect(node(view.container, 'kit')?.textContent).toBe('shared scene kit')
  expect(positions.kit.top).toBeLessThan(positions.tray.top + positions.tray.height)
  expect(positions.kit.top + positions.kit.height).toBeGreaterThan(positions.tray.top + positions.tray.height)
  expect(view.container.querySelector('[data-presentation-node="frame"]')).toBeNull()
})
it('I-34 chains verification in the card row and resolves build/render to pass', () => {
  const view = render(<div className="skill-presentation"><style>{css}</style><Scene payload={{ beat: 7 }} /></div>)
  expect(node(view.container, 'verify-link')?.textContent).toBe('→')
  expect(positions.verify.left).toBeGreaterThan(cardPosition(3).left + cardPosition(3).width)
  expect(positions.verify.top).toBe(cardPosition(0).top)
  expect(node(view.container, 'verify')?.textContent).toContain('build + render')
  expect(getComputedStyle(node(view.container, 'verify')!.querySelector('[data-pass]')!).color).toBe('rgb(156, 228, 188)')
  expect(node(view.container, 'verify')?.querySelector('[data-pass="true"]')?.textContent).toContain('pass')
})
it('I-35 adds a modify arc edited flag and outer self-reference reveal', () => {
  const view = render(<Scene payload={{ beat: 8 }} />)
  expect(node(view.container, 'modify')?.querySelector('path')).toBeTruthy()
  expect(node(view.container, 'edited')?.textContent).toBe('edited')
  expect(node(view.container, 'reveal')).toBeNull()
  const card = node(view.container, 'card-1')
  view.rerender(<Scene payload={{ beat: 9 }} />)
  expect(node(view.container, 'card-1')).toBe(card)
  expect(node(view.container, 'reveal')?.textContent).toContain('THIS PRESENTATION IS THE EXAMPLE')
  expect(positions.reveal.left).toBeLessThan(positions.you.left)
  expect(positions.reveal.left + positions.reveal.width).toBeGreaterThan(positions.verify.left + positions.verify.width)
})
it('I-36 rejects absent count malformed title caption era and ordering', () => {
  for (const invalid of [[], reference.slice(1), [...reference].reverse(),
    reference.map((step, i) => i ? step : { ...step, title: 'wrong' }),
    reference.map((step, i) => i ? step : { ...step, caption: 'wrong' }),
    reference.map((step, i) => i ? step : { ...step, era: 'wrong' })]) {
    expect(() => validateReference(invalid)).toThrow(/sample:/)
  }
})
