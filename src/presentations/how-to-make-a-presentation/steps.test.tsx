// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { STEPS } from './steps'

afterEach(cleanup)

describe('reference presentation', () => {
  it('keeps the normative nine beats ordered in one persistent scene group', () => {
    expect(STEPS.map(step => step.title)).toEqual([
      'You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth',
      'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one",
    ])
    expect(STEPS.every(step => step.groupKey === 'how-to-story' && step.Scene === STEPS[0].Scene)).toBe(true)
    expect(STEPS.every(step => step.caption.length > 0)).toBe(true)
  })

  it('accumulates the persistent conversation, cards, kit, verification, and final reveal', () => {
    const Scene = STEPS[8].Scene
    const { container } = render(<Scene payload={STEPS[8].payload} step={STEPS[8]} index={8} total={9} />)
    const ids = [...container.querySelectorAll('[data-entity-id]')].map(node => node.getAttribute('data-entity-id'))
    for (const id of ['how-to-you', 'how-to-prompt', 'how-to-skill', 'how-to-step-1', 'how-to-step-2', 'how-to-step-3', 'how-to-kit', 'how-to-verify', 'how-to-reveal']) expect(ids).toContain(id)
    expect(container.textContent).toContain('A PRESENTATION MADE WITH THE SKILL')
  })
})
