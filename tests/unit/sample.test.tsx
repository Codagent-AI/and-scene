import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk'
import { ENTITIES } from '../../src/presentations/how-to-make-a-presentation/entities'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'

// Transcribed by hand from the spec's sample table; deliberately not derived from the step data.
const SPEC = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

const NEW_AT_STEP: string[][] = [
  ['you', 'prompt'],
  ['skill', 'conversation', 'question'],
  ['tray', 'card-1', 'link-1', 'morph-label'],
  ['card-2', 'card-3', 'card-4', 'link-2', 'link-3'],
  ['ghost', 'link-4', 'depth-control'],
  ['scene-kit', 'plug'],
  ['verify', 'link-5', 'verify-pass'],
  ['route', 'modify-arc', 'flag'],
  ['reveal-frame'],
]

const key = (k: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })))
const q = (id: string) => document.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)
const present = () => [...document.querySelectorAll('[data-presentation-entity]')].map((e) => e.getAttribute('data-presentation-entity')!)
const num = (el: HTMLElement | null, prop: 'left' | 'top' | 'width' | 'height') => parseFloat(el!.style[prop])

describe('reference sample narration', () => {
  it('has the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(SPEC.map((s) => [...s]))
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })

  it('shows each normative title and caption when rendered, in order', () => {
    render(<Talk />)
    SPEC.forEach(([era, title, caption], i) => {
      expect(document.querySelector('[data-presentation-title]')!.textContent).toBe(title)
      expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe(caption)
      expect(document.querySelector<HTMLElement>('[data-presentation-marker]')!.dataset.presentationEra).toBe(era)
      expect(document.querySelector('[data-step-index]')!.getAttribute('data-step-index')).toBe(String(i))
      if (i < SPEC.length - 1) key('ArrowRight')
    })
    expect(document.querySelector('[data-presentation-nav="next"]')).toHaveProperty('disabled', true)
  })

  it('opens in browse mode with a registered title', () => {
    render(<Talk />)
    expect(document.querySelector('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('browse')
    expect(document.querySelector('[data-presentation-root]')!.getAttribute('data-presentation-title-text')).toBe('How to Use This Skill to Make a Presentation')
  })
})

describe('reference sample scene', () => {
  it('introduces exactly the named entities at each step', () => {
    expect(ENTITIES.map((e) => e.id).sort()).toEqual(NEW_AT_STEP.flat().sort())
    NEW_AT_STEP.forEach((ids, i) => ids.forEach((id) => expect(ENTITIES.find((e) => e.id === id)!.appearsAt, id).toBe(i + 1)))
  })

  it('accumulates one scene: nothing is removed, remounted or moved while stepping forward', () => {
    render(<Talk />)
    const scene = document.querySelector('[data-presentation-scene]')
    const seen = new Map<string, { el: HTMLElement; box: number[] }>()
    NEW_AT_STEP.forEach((_ids, i) => {
      expect(document.querySelector('[data-presentation-scene]')).toBe(scene)
      const expected = NEW_AT_STEP.slice(0, i + 1).flat().sort()
      expect(present().sort()).toEqual(expected)
      for (const id of present()) {
        const el = q(id)!
        const box = el.tagName === 'svg' ? [] : (['left', 'top', 'width', 'height'] as const).map((p) => num(el, p))
        const prior = seen.get(id)
        if (prior) {
          expect(el, `${id} remounted`).toBe(prior.el)
          expect(box, `${id} moved`).toEqual(prior.box)
        }
        seen.set(id, { el, box })
      }
      key('ArrowRight')
    })
  })

  it('draws the content each step calls for', () => {
    render(<Talk />)
    for (let i = 0; i < 2; i++) key('ArrowRight') // -> step 3
    const card = q('card-1')!
    expect([...card.querySelectorAll('[data-part]')].map((p) => p.textContent)).toEqual(['title', 'caption', 'visual'])
    expect(q('morph-label')!.textContent).toBe('what morphs')
    expect(q('tray')).not.toBeNull()
    expect(q('link-1')!.getAttribute('data-presentation-node')).toBe('arrow')
    // morph label sits over the link between consecutive cards, not inside a card
    expect(card.contains(q('morph-label'))).toBe(false)

    key('ArrowRight') // 4
    expect(document.querySelectorAll('[data-presentation-entity^="card-"]')).toHaveLength(4)

    key('ArrowRight') // 5
    expect(q('ghost')!.dataset.variant).toBe('ghost')
    const you = q('you')!
    const control = q('depth-control')!
    expect(num(control, 'left')).toBeGreaterThanOrEqual(num(you, 'left'))
    expect(num(control, 'left') + num(control, 'width')).toBeLessThanOrEqual(num(you, 'left') + num(you, 'width'))
    expect(num(control, 'top') - (num(you, 'top') + num(you, 'height'))).toBeLessThan(80)

    key('ArrowRight') // 6
    const cards = [1, 2, 3, 4].map((n) => q(`card-${n}`)!)
    const cardBottom = num(cards[0], 'top') + num(cards[0], 'height')
    expect(num(q('scene-kit'), 'top')).toBeGreaterThanOrEqual(cardBottom)
    expect(q('scene-kit')!.textContent).toContain('scene kit')
    expect(document.querySelector('[data-presentation-node="frame"]')).toBeNull()

    key('ArrowRight') // 7
    expect(num(q('verify'), 'top')).toBe(num(cards[0], 'top'))
    expect(num(q('verify'), 'left')).toBeGreaterThan(num(q('ghost'), 'left'))
    expect(q('verify')!.textContent).toContain('build')
    expect(q('verify')!.textContent).toContain('render')
    expect(q('verify-pass')!.querySelector('svg')).not.toBeNull()
    expect(q('verify-pass')!.textContent).toBe('pass')

    key('ArrowRight') // 8
    expect(q('modify-arc')!.getAttribute('data-presentation-node')).toBe('arrow')
    expect(q('flag')!.querySelector('svg')).not.toBeNull()
    expect(num(q('flag'), 'left')).toBeGreaterThanOrEqual(num(cards[1], 'left'))

    key('ArrowRight') // 9
    const frame = q('reveal-frame')!
    expect(frame.textContent).not.toBe('')
    for (const id of present().filter((p) => p !== 'reveal-frame')) {
      const el = q(id)!
      if (el.tagName === 'svg') continue
      expect(num(el, 'left')).toBeGreaterThanOrEqual(num(frame, 'left'))
      expect(num(el, 'top')).toBeGreaterThanOrEqual(num(frame, 'top'))
      expect(num(el, 'left') + num(el, 'width')).toBeLessThanOrEqual(num(frame, 'left') + num(frame, 'width'))
      expect(num(el, 'top') + num(el, 'height')).toBeLessThanOrEqual(num(frame, 'top') + num(frame, 'height'))
    }
  })

  it('two-way arrow joins you and skill with a question chip above it', () => {
    render(<Talk />)
    key('ArrowRight')
    expect(document.querySelectorAll('[data-presentation-entity="conversation"] [data-presentation-arrow-head]')).toHaveLength(2)
    const chip = q('question')!
    expect(num(chip, 'top') + num(chip, 'height')).toBeLessThan(54)
    expect(num(q('skill'), 'left')).toBeGreaterThan(num(q('you'), 'left'))
  })

  it('steps back by removing newer entities only, keeping the rest mounted', async () => {
    render(<Talk />)
    for (let i = 0; i < 8; i++) key('ArrowRight')
    const you = q('you')
    key('ArrowLeft')
    await waitFor(() => expect(q('reveal-frame')).toBeNull())
    expect(q('you')).toBe(you)
    expect(q('flag')).not.toBeNull()
  })

  it('shows a caption for every step and moves with next and previous', () => {
    render(<Talk />)
    const caption = () => document.querySelector('[data-presentation-caption]')!.textContent
    const seen: (string | null)[] = []
    for (let i = 0; i < 9; i++) {
      seen.push(caption())
      expect(caption()!.length).toBeGreaterThan(0)
      key('ArrowRight')
    }
    expect(new Set(seen).size).toBe(9)
    key('ArrowLeft')
    expect(caption()).toBe(seen[7])
  })
})
