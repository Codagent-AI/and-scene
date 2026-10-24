import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { CARD_COUNT, ID } from '../../src/presentations/how-to-make-a-presentation/entities'
import { Scene } from '../../src/presentations/how-to-make-a-presentation/steps/Scene'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps/steps'

const EXPECTED = [
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

const idsAt = (beat: number) => {
  const { container, unmount } = render(<Scene payload={{ beat }} stepIndex={beat - 1} />)
  const ids = new Set([...container.querySelectorAll('[data-presentation-id]')].map((e) => e.getAttribute('data-presentation-id')!))
  unmount()
  return ids
}

describe('reference sample outline', () => {
  it('implements the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(EXPECTED)
  })

  it('gives every step a unique stable id and shares one persistent scene', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
  })
})

describe('reference sample scene content', () => {
  it('introduces the intended entities at each beat', () => {
    const intro: Array<[number, string[]]> = [
      [1, [ID.you, ID.prompt]],
      [2, [ID.skill, ID.convo, ID.question]],
      [3, [ID.card(0)]],
      [4, [ID.card(1), ID.card(CARD_COUNT - 1), ID.cardLink(1)]],
      [5, [ID.ghost, ID.depth]],
      [6, [ID.socket, ID.socketLink]],
      [7, [ID.verify, ID.build, ID.render, ID.verifyLink]],
      [8, [ID.modify, ID.flag, ID.flagRing]],
      [9, [ID.frame]],
    ]
    for (const [beat, ids] of intro) {
      const now = idsAt(beat)
      const before = idsAt(beat - 1)
      for (const id of ids) {
        expect(now.has(id), `beat ${beat} has ${id}`).toBe(true)
        if (beat > 1) expect(before.has(id), `beat ${beat - 1} lacks ${id}`).toBe(false)
      }
    }
  })

  it('accumulates entities: nothing leaves or is renamed between beats', () => {
    for (let beat = 2; beat <= 9; beat++) {
      const before = idsAt(beat - 1)
      const now = idsAt(beat)
      for (const id of before) expect(now.has(id), `${id} survives into beat ${beat}`).toBe(true)
    }
  })

  it('draws a frame only in the final reveal beat (the tray is never framed)', () => {
    for (let beat = 1; beat <= 9; beat++) {
      const { container, unmount } = render(<Scene payload={{ beat }} stepIndex={beat - 1} />)
      const frames = [...container.querySelectorAll('[data-presentation-node="frame"]')]
      expect(frames.map((f) => f.getAttribute('data-presentation-id'))).toEqual(beat === 9 ? [ID.frame] : [])
      unmount()
    }
  })

  it('keeps continuing entities mounted (same DOM node) while navigating', () => {
    const { container } = render(<Presentation steps={STEPS} title="t" />)
    const you = container.querySelector(`[data-presentation-id="${ID.you}"]`)
    expect(you).not.toBeNull()
    for (let i = 0; i < 8; i++) act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
    expect(container.querySelector(`[data-presentation-id="${ID.you}"]`)).toBe(you)
    expect(container.querySelector(`[data-presentation-id="${ID.frame}"]`)).not.toBeNull()
  })

  it('wraps only newcomers in Appear: persisting entities are never re-wrapped', () => {
    const { container, rerender } = render(<Scene payload={{ beat: 3 }} stepIndex={2} />)
    const card = container.querySelector(`[data-presentation-id="${ID.card(0)}"]`)
    rerender(<Scene payload={{ beat: 4 }} stepIndex={3} />)
    expect(container.querySelector(`[data-presentation-id="${ID.card(0)}"]`)).toBe(card)
  })
})

describe('departing entities exit', () => {
  it('keeps a dropped entity mounted while it animates out, then removes it', async () => {
    const { container, rerender } = render(<Scene payload={{ beat: 4 }} stepIndex={3} />)
    const card = () => container.querySelector(`[data-presentation-id="${ID.card(3)}"]`)
    expect(card()).not.toBeNull()
    rerender(<Scene payload={{ beat: 3 }} stepIndex={2} />)
    // Not removed synchronously: AnimatePresence holds it until its exit animation completes.
    expect(card()).not.toBeNull()
    await waitFor(() => expect(card()).toBeNull())
    expect(container.querySelector(`[data-presentation-id="${ID.card(0)}"]`)).not.toBeNull()
  })
})
