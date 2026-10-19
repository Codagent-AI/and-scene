import { cleanup, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { idsAtStep } from './entities'
import { STEPS } from './steps'
import { entity, mount, next, prev, renderedIds, settleAt, stepIndex } from './test-support'

vi.setConfig({ testTimeout: 60000 })
afterEach(cleanup)

const caption = (c: HTMLElement) => c.querySelector('[data-presentation-caption]')?.textContent
const heading = (c: HTMLElement) => c.querySelector('h1[data-presentation-title]')?.textContent
const btn = (c: HTMLElement, hook: 'next' | 'prev') => c.querySelector<HTMLButtonElement>(`[data-presentation-${hook}]`) as HTMLButtonElement

describe('browse mode over every sample step (L-41 component half)', () => {
  it('shows each step caption, with working next/previous, index and payload changes, and clamping', async () => {
    const c = mount()
    expect(c.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('browse')

    // clamp at the start
    expect(btn(c, 'prev').disabled).toBe(true)
    fireEvent.click(btn(c, 'prev'))
    expect(stepIndex(c)).toBe(0)

    for (let i = 0; i < STEPS.length; i++) {
      expect(stepIndex(c)).toBe(i)
      expect(caption(c)).toBeTruthy()
      expect(caption(c)).toBe(STEPS[i].caption)
      expect(heading(c)).toBe(STEPS[i].title)
      expect([...renderedIds(c)].sort()).toEqual(idsAtStep(i + 1).sort())
      if (i < STEPS.length - 1) {
        expect(btn(c, 'next').disabled).toBe(false)
        next(c)
        expect(stepIndex(c)).toBe(i + 1)
      }
    }

    // clamp at the end
    expect(btn(c, 'next').disabled).toBe(true)
    fireEvent.click(btn(c, 'next'))
    expect(stepIndex(c)).toBe(STEPS.length - 1)
    expect(caption(c)).toBe(STEPS[8].caption)

    for (let i = STEPS.length - 2; i >= 0; i--) {
      expect(btn(c, 'prev').disabled).toBe(false)
      prev(c)
      expect(stepIndex(c)).toBe(i)
      expect(caption(c)).toBe(STEPS[i].caption)
      await settleAt(c, i + 1)
    }
    expect(btn(c, 'prev').disabled).toBe(true)
    expect(entity(c, idsAtStep(1)[0])).not.toBeNull()
  }, 60000)
})
