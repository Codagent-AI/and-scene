// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SAMPLE_STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/SampleScene'
import { EMPTY_STATE, visibleEntities, type EntityId, type SamplePayload } from '../../src/presentations/how-to-make-a-presentation/state'
import { TEXT_NODES } from '../../src/presentations/how-to-make-a-presentation/geometry'
import { layoutIdFor } from '../../src/presentations/how-to-make-a-presentation/entities'
import { LAYOUT_T } from '../../src/presentation-kit/constants'

vi.mock('motion/react', () => import('./support/motionMock'))

// Independent transcription of the normative outline in the change's spec (not imported from production).
const SPEC_OUTLINE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  [
    'the gathering',
    'Answers become steps',
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  ],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  [
    'the build',
    'It assembles the scene',
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  ],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

const payloadAt = (index: number): SamplePayload => SAMPLE_STEPS[index].payload

afterEach(() => cleanup())

describe('committed reference sample outline', () => {
  it('has nine steps whose era, title, and caption match the normative outline in order', () => {
    expect(SAMPLE_STEPS).toHaveLength(SPEC_OUTLINE.length)
    SPEC_OUTLINE.forEach(([era, title, caption], index) => {
      expect(SAMPLE_STEPS[index]).toMatchObject({ era, title, caption })
    })
  })

  it('shares one group and one scene component across all steps', () => {
    const groups = new Set(SAMPLE_STEPS.map((step) => step.groupKey))
    const scenes = new Set(SAMPLE_STEPS.map((step) => step.scene))
    expect(groups.size).toBe(1)
    expect(scenes.size).toBe(1)
  })
})

describe('scene intent per step', () => {
  const expectations: [number, Partial<Record<keyof SamplePayload['state'], unknown>>][] = [
    [0, { you: true, prompt: true, skill: false, cards: 0 }],
    [1, { skill: true, link: true, question: true, cards: 0 }],
    [2, { cards: 1, tray: undefined }],
    [3, { cards: 3, morph: true }],
    [4, { ghost: true, control: true, socket: false }],
    [5, { socket: true, verify: false }],
    [6, { verify: true, verifyPassed: true, modify: false }],
    [7, { modify: true, flagged: true, reveal: false }],
    [8, { reveal: true }],
  ]

  for (const [index, expected] of expectations) {
    it(`step ${index + 1} shows the specified entities`, () => {
      const state = payloadAt(index).state
      for (const [key, value] of Object.entries(expected)) {
        if (value === undefined) continue
        expect(state[key as keyof typeof state]).toEqual(value)
      }
    })
  }

  it('accumulates: nothing on screen disappears between adjacent steps', () => {
    for (let index = 1; index < SAMPLE_STEPS.length; index += 1) {
      const before = visibleEntities(payloadAt(index - 1).state)
      const after = new Set(visibleEntities(payloadAt(index).state))
      for (const id of before) expect(after.has(id)).toBe(true)
    }
  })

  it('marks only the newly arriving entities as entering on each step', () => {
    for (let index = 0; index < SAMPLE_STEPS.length; index += 1) {
      const previous = index === 0 ? [] : visibleEntities(payloadAt(index - 1).state)
      const arriving = visibleEntities(payloadAt(index).state).filter((id) => !previous.includes(id))
      expect(arriving.length).toBeGreaterThan(0)
      expect(payloadAt(index)).not.toHaveProperty('entering')
      expect(arriving.every((id) => !previous.includes(id))).toBe(true)
    }
  })

  it('has no visible entities in the empty state', () => {
    expect(visibleEntities(EMPTY_STATE)).toEqual([])
  })
})

describe('rendering the sample scene', () => {
  const renderAt = (index: number) => {
    const payload = payloadAt(index)
    return render(<SampleScene payload={payload} />)
  }

  it('gives continuing entities the same element and layout identity across steps', () => {
    const { container, rerender } = renderAt(0)
    const you = () => container.querySelector(`[data-layout-id="${layoutIdFor('you')}"]`)
    const before = you()
    expect(before).not.toBeNull()
    rerender(<SampleScene payload={payloadAt(1)} />)
    expect(you()).toBe(before)
  })

  it('wraps only the entities that arrive on a step in an entering Appear', () => {
    const { container, rerender } = renderAt(0)
    for (let index = 0; index < SAMPLE_STEPS.length; index += 1) {
      if (index > 0) rerender(<SampleScene payload={payloadAt(index)} />)
      const previous = index === 0 ? [] : visibleEntities(payloadAt(index - 1).state)
      const arriving = visibleEntities(payloadAt(index).state).filter((id) => !previous.includes(id))
      const entering = [...container.querySelectorAll('[data-presentation-appear="entering"]')]
        .map((node) => node.getAttribute('data-presentation-appear-id'))
        .sort()
      expect(entering).toEqual(arriving.map((id) => layoutIdFor(id)).sort())
    }
  })

  it('after a forward jump, every entity not yet shown enters, not only the outline predecessor', () => {
    const { container, rerender } = renderAt(0)
    rerender(<SampleScene payload={payloadAt(8)} />)
    const entering = [...container.querySelectorAll('[data-presentation-appear="entering"]')]
      .map((node) => node.getAttribute('data-presentation-appear-id'))
      .sort()
    const shownAtFirst = new Set(visibleEntities(payloadAt(0).state))
    const expected = visibleEntities(payloadAt(8).state)
      .filter((id) => !shownAtFirst.has(id))
      .map((id) => layoutIdFor(id))
      .sort()
    expect(entering).toEqual(expected)
    expect(entering.length).toBeGreaterThan(visibleEntities(payloadAt(8).state).length / 2)
  })

  it('after a backward jump, entities already on screen keep their elements and do not re-enter', () => {
    const { container, rerender } = renderAt(4)
    const you = container.querySelector(`[data-layout-id="${layoutIdFor('you')}"]`)
    rerender(<SampleScene payload={payloadAt(1)} />)
    expect(container.querySelector(`[data-layout-id="${layoutIdFor('you')}"]`)).toBe(you)
    expect(container.querySelectorAll('[data-presentation-appear="entering"]').length).toBe(0)
  })

  it('renders continuing entities without an entry animation (initial=false, no reset to opacity 0)', () => {
    const { container, rerender } = renderAt(3)
    rerender(<SampleScene payload={payloadAt(4)} />)
    const continuing = container.querySelectorAll('[data-presentation-appear="continuing"]')
    expect(continuing.length).toBeGreaterThan(0)
    for (const wrapper of continuing) {
      expect(wrapper.getAttribute('data-motion-initial')).toBe('false')
    }
  })

  it('gives newcomers a fade-in whose delay follows the morph window', () => {
    const { container } = renderAt(1)
    const newcomer = container.querySelector('[data-presentation-appear="entering"]') as HTMLElement
    const transition = JSON.parse(newcomer.getAttribute('data-motion-transition') ?? '{}')
    expect(transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('marks only the intentional overlaps as allowed to overlap', () => {
    const { container } = renderAt(8)
    const allowed = [...container.querySelectorAll('[data-presentation-allow-overlap]')]
      .map((node) => node.getAttribute('data-presentation-entity'))
      .sort()
    expect(allowed).toEqual([layoutIdFor('control'), layoutIdFor('flag'), layoutIdFor('reveal')].sort())
  })

  it('shows the build and render checks on the verify node at step 7', () => {
    const { container } = renderAt(6)
    const verify = container.querySelector(`[data-presentation-entity="${layoutIdFor('verify')}"]`)
    expect(verify?.textContent).toContain('build')
    expect(verify?.textContent).toContain('render')
    expect(renderAt(5).container.querySelector(`[data-presentation-entity="${layoutIdFor('verify')}"]`)).toBeNull()
  })

  it('renders every entity type named in the scene intent', () => {
    const ids: EntityId[] = [
      'you', 'prompt', 'skill', 'link', 'question', 'card-1', 'card-2', 'card-3', 'morph-arrow', 'morph-label',
      'ghost', 'control', 'socket', 'chain', 'verify', 'modify-arc', 'modify-label', 'flag', 'reveal',
    ]
    const { container } = renderAt(8)
    const rendered = [...container.querySelectorAll('[data-presentation-entity]')].map((node) =>
      node.getAttribute('data-presentation-entity'),
    )
    expect(new Set(rendered)).toEqual(new Set(ids.map(layoutIdFor)))
  })
})

describe('sample layout', () => {
  it('keeps every pair of top-level text nodes apart unless the overlap is marked', () => {
    const entries = Object.entries(TEXT_NODES)
    const hits: string[] = []
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const [nameA, a] = entries[i]
        const [nameB, b] = entries[j]
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
        if (overlapX > 0 && overlapY > 0) hits.push(`${nameA} x ${nameB}`)
      }
    }
    // control docks on `you` by design; it is the only marked overlap among text nodes.
    expect(hits).toEqual(['you x control'])
  })

  it('keeps every node inside the 880 x 380 canvas', () => {
    for (const rect of Object.values(TEXT_NODES)) {
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(880)
      expect(rect.y + rect.height).toBeLessThanOrEqual(380)
    }
  })
})
