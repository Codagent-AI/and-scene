import { createElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReferenceScene } from './ReferenceScene'
import { REFERENCE_STEP_OUTLINE } from './outline'
import { STEPS } from './steps'

describe('reference sample outline', () => {
  it('Scenario: Sample exists and matches the outline — eight normative steps', () => {
    expect(REFERENCE_STEP_OUTLINE).toHaveLength(8)
    expect(STEPS).toHaveLength(8)
  })

  it('implements steps in order with normative era, title, and caption', () => {
    for (let i = 0; i < REFERENCE_STEP_OUTLINE.length; i++) {
      const expected = REFERENCE_STEP_OUTLINE[i]
      const actual = STEPS[i]
      expect(actual.era).toBe(expected.era)
      expect(actual.title).toBe(expected.title)
      expect(actual.caption).toBe(expected.caption)
    }
  })

  it('each step has a stable id and Scene component', () => {
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(8)
    for (const step of STEPS) {
      expect(step.Scene).toBeTypeOf('function')
    }
  })

  it('uses one persistent scene group so the reference demo morphs in place', () => {
    const scene = STEPS[0].Scene
    const groupKey = STEPS[0].groupKey

    expect(groupKey).toBeTypeOf('string')
    for (const step of STEPS) {
      expect(step.groupKey).toBe(groupKey)
      expect(step.Scene).toBe(scene)
    }
  })

  it('does not style shared layout nodes with transform or opacity utilities', () => {
    const disallowed = /\b(?:-?rotate-\d+|scale-\d+|opacity-\d+)\b/

    for (const step of STEPS) {
      const Scene = step.Scene
      const { container, unmount } = render(createElement(Scene, { step }))
      expect(container.innerHTML, step.id).not.toMatch(disallowed)
      unmount()
    }
  })

  it('does not put conflicting positioning utilities on the same element', () => {
    for (const step of STEPS) {
      const Scene = step.Scene
      const { container, unmount } = render(createElement(Scene, { step }))
      for (const el of Array.from(container.querySelectorAll('[class]'))) {
        const className = el.getAttribute('class') ?? ''
        expect(className, `${step.id}: ${className}`).not.toMatch(/\babsolute\b.*\brelative\b|\brelative\b.*\babsolute\b/)
      }
      unmount()
    }
  })

  it('does not fade overlapping step-stack cards through each other', () => {
    const step = STEPS.find((s) => s.id === 'answers-become-steps')
    expect(step).toBeDefined()
    const Scene = step!.Scene
    const { container } = render(createElement(Scene, { step: step! }))
    const cards = Array.from(container.querySelectorAll('.ref-step-stack-card')).filter((el) =>
      el.textContent?.includes('Step '),
    )

    expect(cards).toHaveLength(3)
    for (const card of cards) {
      const parentStyle = card.parentElement?.getAttribute('style') ?? ''
      expect(parentStyle, card.textContent ?? '').not.toMatch(/opacity/)
    }
  })

  it('renders content for every outline step and fails loudly for unknown ids', () => {
    for (const step of STEPS) {
      const { container, unmount } = render(createElement(ReferenceScene, { step }))
      expect(container.querySelector('.ref-box, .ref-frame'), step.id).not.toBeNull()
      unmount()
    }

    expect(() =>
      render(
        createElement(ReferenceScene, {
          step: { ...STEPS[0], id: 'unknown-step' },
        }),
      ),
    ).toThrow(/Unknown reference step id/)
  })
})
