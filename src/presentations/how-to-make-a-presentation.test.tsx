import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Presentation } from '../presentation-kit/Presentation'
import { presentations, resolvePresentation } from './index'
import Talk from './how-to-make-a-presentation/Talk'
import { STEPS } from './how-to-make-a-presentation/steps'
import { ENTITY_IDS } from './how-to-make-a-presentation/entities'

const outline = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

describe('reference presentation', () => {
  it('is registered and matches the nine-step outline', async () => {
    const entry = resolvePresentation('/how-to-make-a-presentation', presentations)
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(entry && await entry.load()).toHaveProperty('default')
    expect(STEPS.map(({ era, title, caption }) => [era, title, caption])).toEqual(outline)
    expect(STEPS).toHaveLength(9)
  })

  it('navigates through all steps, clamps at the end, and renders without console errors', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = render(<Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />)
    const root = container.querySelector('[data-step-index]')!
    expect(root.getAttribute('data-step-count')).toBe('9')
    const requiredEntities: Record<number, string[]> = {
      2: ['step-card-1'],
      4: ['ghost-card', 'depth-control'],
      5: ['scene-kit'],
      6: ['verify'],
      7: ['modify'],
      8: ['outer-frame'],
    }
    for (let index = 1; index < 9; index += 1) {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => expect(root.getAttribute('data-step-index')).toBe(String(index)))
      const renderedIds = [...container.querySelectorAll('[data-presentation-node]')].map((node) => node.getAttribute('data-presentation-node')!)
      expect(renderedIds.every((id) => ENTITY_IDS.includes(id as typeof ENTITY_IDS[number]))).toBe(true)
      for (const id of requiredEntities[index] ?? []) expect(renderedIds).toContain(id)
    }
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('8')
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('declares and uses the named entities in their required steps', () => {
    const used = new Set<string>()
    STEPS.forEach(({ payload }) => payload.entities.forEach((id) => used.add(id)))
    expect([...used].every((id) => ENTITY_IDS.includes(id as typeof ENTITY_IDS[number]))).toBe(true)
    const at = (step: number, id: string) => expect(STEPS[step - 1].payload.entities).toContain(id)
    at(1, 'you'); at(1, 'prompt'); at(2, 'skill'); at(2, 'question-chip')
    at(3, 'step-card-1'); at(5, 'ghost-card'); at(6, 'scene-kit'); at(7, 'verify')
    at(8, 'modify'); at(9, 'outer-frame')
    expect(Talk).toBeTruthy()
  })
})
