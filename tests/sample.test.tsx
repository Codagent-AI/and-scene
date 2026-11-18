import { describe, expect, it } from 'vitest'
import { render, fireEvent, screen, within } from '@testing-library/react'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { entities, stateFor } from '../src/presentations/how-to-make-a-presentation/entities'
import { StoryScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { outline } from '../src/presentations/how-to-make-a-presentation/outline'
import { presentations } from '../src/presentations'
import { Router } from '../src/Router'
import { validateReference } from '../scripts/verify.mjs'
import expected from '../scripts/reference-outline.json'

describe('reference sample', () => {
  it('I-34 canonical nine ordered metadata records and registration', () => {
    expect(STEPS.map(({ id, era, title, caption }) => ({ id, era, title, caption }))).toEqual(expected)
    expect(presentations[0].slug).toBe('how-to-make-a-presentation'); expect(STEPS).toHaveLength(9)
  })
  it.each([[1, ['you', 'prompt']], [2, ['you', 'prompt', 'skill', 'conversation', 'question']], [3, ['tray', 'card-1']], [4, ['card-2', 'morph-1']], [5, ['ghost', 'depth']], [6, ['kit']], [7, ['verify', 'verify-link']], [8, ['modify', 'edited']], [9, ['reveal']]] as const)('I-35–38 beat %i required entities', (beat, ids) => {
    render(<StoryScene payload={beat} />)
    for (const id of ids) expect(document.querySelector(`[data-presentation-entity="how-to-make-a-presentation:${id}"]`)).toBeTruthy()
    for (const entity of entities.filter(entity => entity.beat > beat)) expect(document.querySelector(`[data-presentation-entity="how-to-make-a-presentation:${entity.id}"]`)).toBeNull()
  })
  it('I-36 cards have parts and morph labels are separate links', () => {
    render(<StoryScene payload={5} />)
    const cards = [...document.querySelectorAll('[data-presentation-entity].card')]
    expect(cards).toHaveLength(2)
    for (const [index, card] of cards.entries()) {
      expect(within(card as HTMLElement).getByText(index === 0 ? '01 / the idea' : '02 / the story')).toBeTruthy()
      const parts = card.querySelector('small')!
      expect([...parts.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent?.trim())).toEqual(['title', 'caption'])
      expect(within(parts).getByText('visual', { exact: true }).tagName).toBe('B')
    }
    const link = screen.getByText('morph →').closest('[data-presentation-entity]')!
    expect(link.className).toContain('link')
    expect(cards.every(card => !card.contains(link))).toBe(true)
    const geometry = (element: Element) => {
      const style = (element.parentElement as HTMLElement).style
      return { x: parseFloat(style.left), y: parseFloat(style.top), w: parseFloat(style.width), h: parseFloat(style.height) }
    }
    const [first, second] = cards.map(geometry); const connector = geometry(link)
    expect(connector.x).toBeGreaterThanOrEqual(first.x + first.w)
    expect(connector.x + connector.w).toBeLessThanOrEqual(second.x)
    for (const card of [first, second]) {
      expect(connector.y + connector.h / 2).toBeGreaterThanOrEqual(card.y)
      expect(connector.y + connector.h / 2).toBeLessThanOrEqual(card.y + card.h)
    }
    expect(screen.getByText('partial ↔ full')).toBeTruthy()
  })
  it('I-37 socket geometry and pipeline resolved pass', () => {
    const tray = entities.find(e => e.id === 'tray')!; const socket = entities.find(e => e.id === 'kit')!; const verify = entities.find(e => e.id === 'verify')!
    expect(socket.y).toBeLessThan(tray.y + tray.h); expect(socket.y + socket.h).toBeGreaterThan(tray.y + tray.h)
    expect(verify.y).toBe(entities.find(e => e.id === 'card-1')!.y)
    render(<StoryScene payload={7} />); expect(screen.getByText('✓ pass')).toBeTruthy(); expect(screen.getByText(/build ✓/)).toBeTruthy()
  })
  it('I-39 entity accumulation fixed coordinates stable DOM', () => {
    const view = render(<StoryScene payload={1} />); const previous = new Map<string, Element>()
    for (let beat = 1; beat <= 9; beat++) {
      view.rerender(<StoryScene payload={beat} />)
      for (const entity of stateFor(beat)) {
        const element = document.querySelector(`[data-presentation-entity="how-to-make-a-presentation:${entity.id}"]`)!
        if (previous.has(entity.id)) expect(element).toBe(previous.get(entity.id))
        const wrapper = element.parentElement as HTMLElement
        expect(wrapper.style.left).toBe(`${entity.x}px`); expect(wrapper.style.top).toBe(`${entity.y}px`)
        previous.set(entity.id, element)
        expect(entity.x + entity.w).toBeLessThanOrEqual(880); expect(entity.y + entity.h).toBeLessThanOrEqual(380)
      }
      expect(STEPS[beat - 1].Scene).toBe(StoryScene); expect(STEPS[beat - 1].groupKey).toBe('story')
    }
  })
  it('I-41 missing malformed and out-of-order metadata fail', () => {
    expect(() => validateReference([], expected)).toThrow('9 steps')
    expect(() => validateReference([...outline].reverse(), expected)).toThrow('step 0')
    expect(() => validateReference(outline.map((s, i) => i === 2 ? { ...s, caption: 'wrong' } : s), expected)).toThrow('step 2: invalid caption')
    expect(() => validateReference(outline, expected)).not.toThrow()
  })
  it('I-26 registry landing route and unknown fallback', async () => {
    const view = render(<Router pathname="/unknown" />)
    expect(screen.getByRole('link', { name: /How to Use/ }).getAttribute('href')).toBe('/how-to-make-a-presentation')
    view.rerender(<Router pathname="/how-to-make-a-presentation" />)
    expect(await screen.findByText('You have a topic')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); expect(screen.getByText('The skill interviews you')).toBeTruthy()
  })
})
