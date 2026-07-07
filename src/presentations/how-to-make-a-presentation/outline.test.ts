import { createElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReferenceScene } from './ReferenceScene'
import { REFERENCE_STEP_OUTLINE } from './outline'
import { STEPS } from './steps'

describe('reference sample outline', () => {
  it('Scenario: Sample exists and matches the outline — nine normative steps', () => {
    expect(REFERENCE_STEP_OUTLINE).toHaveLength(9)
    expect(STEPS).toHaveLength(9)
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

  it('each step has a stable id, payload, and Scene component', () => {
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(9)
    for (const step of STEPS) {
      expect(step.Scene).toBeTypeOf('function')
      expect(step.payload).toBeTypeOf('object')
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

  it('accumulates the scene instead of rearranging it', () => {
    // Each beat may only add to (or keep) what the previous beat showed for the
    // long-lived anatomy: the skill, the cards, and the route. Removals are
    // reserved for transient annotations (question chip, ghost card, loop arc).
    for (let i = 1; i < STEPS.length; i++) {
      const prev = STEPS[i - 1].payload ?? {}
      const curr = STEPS[i].payload ?? {}
      expect(curr.cards ?? 0, STEPS[i].id).toBeGreaterThanOrEqual(prev.cards ?? 0)
      if (prev.skill) expect(curr.skill, STEPS[i].id).toBe(true)
      if (prev.route) expect(curr.route, STEPS[i].id).toBe(true)
    }
  })

  it('does not style shared layout nodes with transform or opacity utilities', () => {
    const disallowed = /\b(?:-?rotate-\d+|scale-\d+|opacity-\d+)\b/

    for (const step of STEPS) {
      const { container, unmount } = render(createElement(step.Scene, { step }))
      expect(container.innerHTML, step.id).not.toMatch(disallowed)
      unmount()
    }
  })

  it('does not put conflicting positioning utilities on the same element', () => {
    for (const step of STEPS) {
      const { container, unmount } = render(createElement(step.Scene, { step }))
      for (const el of Array.from(container.querySelectorAll('[class]'))) {
        const className = el.getAttribute('class') ?? ''
        expect(className, `${step.id}: ${className}`).not.toMatch(/\babsolute\b.*\brelative\b|\brelative\b.*\babsolute\b/)
      }
      unmount()
    }
  })

  it('renders the scene content for every outline step', () => {
    for (const step of STEPS) {
      const { container, unmount } = render(createElement(ReferenceScene, { step }))
      expect(container.querySelector('.ref-box, .ref-bubble'), step.id).not.toBeNull()
      unmount()
    }
  })
})
