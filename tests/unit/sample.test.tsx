import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/steps/Scene'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { LayoutGroup } from 'motion/react'

const scene = (stage: number) => (
  <LayoutGroup>
    <SampleScene payload={{ stage }} stepIndex={stage - 1} />
  </LayoutGroup>
)
const snapshot = () =>
  new Map(
    [...document.querySelectorAll<HTMLElement>('[data-presentation-id]')].map((el) => [
      el.getAttribute('data-presentation-id')!,
      `${el.style.left},${el.style.top},${el.style.width},${el.style.height}`,
    ]),
  )

describe('reference sample scene', () => {
  it('every stage renders without console errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (let stage = 1; stage <= 9; stage++) render(scene(stage)).unmount()
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('entities accumulate and never move or disappear between adjacent steps (I-4)', () => {
    const { rerender } = render(scene(1))
    let before = snapshot()
    for (let stage = 2; stage <= 9; stage++) {
      rerender(scene(stage))
      const after = snapshot()
      for (const [id, box] of before) {
        expect(after.has(id), `${id} persists into stage ${stage}`).toBe(true)
        expect(after.get(id), `${id} keeps its place`).toBe(box)
      }
      expect(after.size).toBeGreaterThan(before.size - 1)
      before = after
    }
  })

  it('continuing entities keep their DOM node and are not re-faded (I-8)', async () => {
    const { rerender, getByText } = render(scene(1))
    const you = getByText('you')
    expect(you.style.opacity).toBe('0') // newcomer starts hidden
    await waitFor(() => expect(you.style.opacity).toBe('1'), { timeout: 5000 })
    rerender(scene(2))
    expect(getByText('you')).toBe(you)
    expect(you.style.opacity).toBe('1') // stays fully visible: no fade restart
  })

  it('preserves the intentional stacking of the edit marker over its card (I-9)', () => {
    render(scene(8))
    const ids = snapshot()
    expect(ids.get('htm-edited')).toBe(ids.get('htm-card-2'))
  })

  it('steps share one scene group so the scene persists across the deck (I-7)', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.stage)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('owns active-chrome and attribution styling in its own CSS (I-55)', () => {
    const css = readFileSync('src/presentations/how-to-make-a-presentation/talk.css', 'utf8')
    expect(css).toMatch(/\[data-presentation-dot\]\[data-presentation-active\]/)
    expect(css).toMatch(/\[data-presentation-toc-item\]\[data-presentation-active\]/)
    expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*font-size:\s*1[1-9]px/)
  })

  it('keeps its entity ids and literal canvas coordinates in its own entities.ts (I-13)', () => {
    const entities = readFileSync('src/presentations/how-to-make-a-presentation/entities.ts', 'utf8')
    expect(entities).toMatch(/export const E = /)
    expect(entities).toMatch(/export const AT = /)
  })
})
