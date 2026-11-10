import { describe, test, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { ReferenceScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { stateAt } from '../src/presentations/how-to-make-a-presentation/entities'
import expected from '../scripts/reference-outline.json'
import { ENTER_DELAY, ENTER_T } from '../src/presentation-kit/constants'
import { validateOutline } from '../scripts/validation.mjs'

const ids = (beat: number) =>
  stateAt(beat).map((entity) => entity.id.split(':')[1])
describe('reference scene', () => {
  test('I-26 normative outline validation rejects absence, count, altered metadata and reorder', () => {
    expect(() => validateOutline(STEPS, expected)).not.toThrow()
    for (const invalid of [undefined, [], STEPS.slice(1), [...STEPS].reverse()])
      expect(() => validateOutline(invalid, expected)).toThrow('sample outline')
    for (const key of ['id', 'era', 'title', 'caption'])
      expect(() =>
        validateOutline(
          STEPS.map((s, i) => (i === 3 ? { ...s, [key]: 'wrong' } : s)),
          expected,
        ),
      ).toThrow(`step 3: ${key}`)
  })
  test('I-27 accumulated entities retain their ids, coordinates and grouped component', () => {
    for (let beat = 2; beat <= 9; beat++) {
      for (const entity of stateAt(beat - 1))
        expect(stateAt(beat).find((next) => next.id === entity.id)).toEqual(
          entity,
        )
      expect(STEPS[beat - 1].Scene).toBe(STEPS[0].Scene)
      expect(STEPS[beat - 1].groupKey).toBe(STEPS[0].groupKey)
    }
    const { container, rerender } = render(<ReferenceScene payload={1} />)
    const you = container.querySelector(
      '[data-presentation-entity="how-to:you"]',
    )
    rerender(<ReferenceScene payload={9} />)
    expect(
      container.querySelector('[data-presentation-entity="how-to:you"]'),
    ).toBe(you)
    expect(
      container
        .querySelector('[data-presentation-entity="how-to:you"]')
        ?.closest('[data-presentation-appear]'),
    ).toBe(you?.parentElement)
  })
  test('I-28 initial prompt and bidirectional conversation with question above', () => {
    expect(ids(1)).toEqual(['you', 'prompt'])
    expect(ids(2)).toEqual([
      'you',
      'prompt',
      'skill',
      'conversation',
      'question',
    ])
    const { container } = render(<ReferenceScene payload={2} />)
    expect(container.textContent).toContain('⟷')
    const question = stateAt(2).find((entity) =>
      entity.id.endsWith(':question'),
    )!
    const arrow = stateAt(2).find((entity) =>
      entity.id.endsWith(':conversation'),
    )!
    expect(question.y + question.height).toBeLessThan(arrow.y)
  })
  test('I-29 tray cards carry title/caption/visual and morph labels live on links', () => {
    const { container } = render(<ReferenceScene payload={4} />)
    expect(ids(3)).toContain('tray')
    expect(ids(3).filter((id) => id.startsWith('card'))).toHaveLength(1)
    expect(container.querySelectorAll('.card')).toHaveLength(3)
    container.querySelectorAll('.card').forEach((card) => {
      expect(card.textContent).toContain('title · caption · visual')
      expect(card.textContent).not.toContain('morphs')
    })
    container
      .querySelectorAll('.link')
      .forEach((link) => expect(link.textContent).toContain('morphs'))
    expect(container.querySelectorAll('.link')).toHaveLength(2)
  })
  test('I-30 ghost/depth and kit socket dock to existing geometry without framing tray', () => {
    const { container } = render(<ReferenceScene payload={6} />)
    expect(ids(5)).toContain('ghost')
    expect(ids(5)).toContain('depth')
    expect(container.querySelector('.depth')?.textContent).toBe(
      'partial ⟷ full',
    )
    expect(container.querySelector('.socket')?.textContent).toBe(
      'shared scene kit',
    )
    const socket = stateAt(6).find((e) => e.kind === 'socket')!
    const tray = stateAt(6).find((e) => e.kind === 'tray')!
    expect(socket.y).toBe(tray.y + tray.height)
    expect(container.querySelector('.tray')?.classList.contains('frame')).toBe(
      false,
    )
  })
  test('I-31 verification resolves to pass and modification flags an existing card', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<ReferenceScene payload={7} />)
    expect(
      container
        .querySelector('[data-check-state]')
        ?.getAttribute('data-check-state'),
    ).toBe('checking')
    await act(async () => {
      vi.advanceTimersByTime((ENTER_DELAY + ENTER_T) * 1000)
    })
    expect(
      container
        .querySelector('[data-check-state]')
        ?.getAttribute('data-check-state'),
    ).toBe('checking')
    await act(async () => {
      vi.advanceTimersByTime(349)
    })
    expect(
      container
        .querySelector('[data-check-state]')
        ?.getAttribute('data-check-state'),
    ).toBe('checking')
    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(
      container
        .querySelector('[data-check-state]')
        ?.getAttribute('data-check-state'),
    ).toBe('passed')
    expect(container.querySelector('.verify')?.textContent).toContain(
      'build ✓render ✓',
    )
    const verify = stateAt(7).find((e) => e.kind === 'verify')!
    const cards = stateAt(7).filter((e) => e.kind === 'card')
    expect(verify.x).toBeGreaterThan(cards.at(-1)!.x)
    expect(Math.abs(verify.y - cards[0].y)).toBeLessThan(10)
    rerender(<ReferenceScene payload={8} />)
    expect(container.querySelector('.modify svg path')).toBeTruthy()
    expect(container.querySelector('.card [data-edited]')?.textContent).toBe(
      'edited',
    )
    vi.useRealTimers()
  })
  test('I-32 final reveal frame encloses the accumulated diagram and preserves all entities', () => {
    const { container } = render(<ReferenceScene payload={9} />)
    expect(container.querySelector('.frame')?.textContent).toBe(
      'this is one, too.',
    )
    const frame = stateAt(9).find((e) => e.kind === 'frame')!
    for (const entity of stateAt(8)) {
      expect(entity.x).toBeGreaterThan(frame.x)
      expect(entity.y).toBeGreaterThan(frame.y)
      expect(entity.x + entity.width).toBeLessThan(frame.x + frame.width)
      expect(entity.y + entity.height).toBeLessThan(frame.y + frame.height)
    }
    expect(
      container.querySelectorAll('[data-presentation-entity]'),
    ).toHaveLength(stateAt(9).length)
  })
})
