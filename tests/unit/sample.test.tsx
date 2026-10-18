// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { STEP_META } from '../../src/presentations/how-to-make-a-presentation/meta'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/steps/SampleScene'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { presentations } from '../../src/presentations'

afterEach(cleanup)

// Independent copy of the normative table from specs/presentation-verification/spec.md.
const NORMATIVE = [
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

describe('reference sample', () => {
  it('has the nine normative eras, titles and captions in order, with unique ids', () => {
    expect(STEP_META.map((s) => [s.era, s.title, s.caption])).toEqual(NORMATIVE)
    expect(new Set(STEP_META.map((s) => s.id)).size).toBe(9)
    expect(STEPS.map((s) => s.title)).toEqual(NORMATIVE.map((n) => n[1]))
  })

  it('every step carries the five fields and a renderable Scene state', () => {
    for (const step of STEPS) {
      expect(step.id && step.era && step.title && step.caption).toBeTruthy()
      expect(step.Scene).toBe(SampleScene)
      expect(step.groupKey).toBe('scene')
    }
    expect(STEPS.map((s) => s.payload.beat)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('is registered under its slug', () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(typeof entry?.load).toBe('function')
  })

  it('is styled by presentation-owned CSS, including active chrome and attribution', () => {
    const css = readFileSync(path.resolve(import.meta.dirname, '../../src/presentations/how-to-make-a-presentation/talk.css'), 'utf8')
    expect(css).toMatch(/\[data-presentation-progress-item\]\[data-presentation-active\]/)
    expect(css).toMatch(/\[data-presentation-toc-item\]\[data-presentation-active\]/)
    expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*font-size:\s*1[3-9]px/)
  })
})

interface Snapshot {
  [id: string]: { left: string; top: string; width: string; height: string; text: string }
}

function snapshot(beat: number): Snapshot {
  const { container } = render(
    <SampleScene
      payload={{ beat }}
      step={STEP_META[beat - 1]}
      index={beat - 1}
      count={9}
      mode="browse"
    />,
  )
  const out: Snapshot = {}
  for (const el of container.querySelectorAll<HTMLElement>('[data-presentation-id]')) {
    const id = el.getAttribute('data-presentation-id')!
    out[id] = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height, text: (el.textContent ?? '').trim() }
  }
  cleanup()
  return out
}

describe('sample scene intent', () => {
  const beats = Array.from({ length: 9 }, (_, i) => snapshot(i + 1))
  const has = (beat: number, ...ids: string[]) => ids.every((id) => id in beats[beat - 1])

  it('introduces the normative entities at their beats', () => {
    expect(has(1, 'hmp-you', 'hmp-prompt')).toBe(true)
    expect(has(1, 'hmp-skill')).toBe(false)
    expect(has(2, 'hmp-skill', 'hmp-talk-arrow', 'hmp-question-chip')).toBe(true)
    expect(has(3, 'hmp-tray', 'hmp-card-1', 'hmp-link-1', 'hmp-morph')).toBe(true)
    expect(beats[2]['hmp-card-1'].text).toContain('title')
    expect(beats[2]['hmp-card-1'].text).toContain('caption')
    expect(beats[2]['hmp-card-1'].text).toContain('visual')
    expect(has(3, 'hmp-card-2')).toBe(false)
    expect(has(4, 'hmp-card-2', 'hmp-card-3', 'hmp-card-4')).toBe(true)
    expect(has(5, 'hmp-ghost', 'hmp-depth')).toBe(true)
    expect(has(6, 'hmp-scene-kit')).toBe(true)
    expect(has(6, 'hmp-verify')).toBe(false)
    expect(has(7, 'hmp-verify', 'hmp-verify-link', 'hmp-pass')).toBe(true)
    expect(has(8, 'hmp-route', 'hmp-modify-down', 'hmp-modify-in', 'hmp-edited')).toBe(true)
    expect(has(9, 'hmp-frame')).toBe(true)
    expect(has(8, 'hmp-frame')).toBe(false)
  })

  it('never rearranges an entity that persists, except the focus ring that is meant to move', () => {
    for (let beat = 1; beat < 9; beat++) {
      for (const [id, before] of Object.entries(beats[beat - 1])) {
        if (id === 'hmp-focus' || !(id in beats[beat])) continue
        expect(beats[beat][id], `${id} between beats ${beat} and ${beat + 1}`).toEqual(before)
      }
    }
  })

  it('keeps every earlier entity on screen (entities accumulate) through the final reveal', () => {
    for (let beat = 1; beat < 9; beat++) {
      for (const id of Object.keys(beats[beat - 1])) {
        if (id !== 'hmp-focus') expect(id in beats[beat], `${id} dropped at beat ${beat + 1}`).toBe(true)
      }
    }
  })

  it('docks the scene-kit socket on the tray bottom without framing the tray, and chains verify in the card row', () => {
    const tray = beats[5]['hmp-tray']
    const kit = beats[5]['hmp-scene-kit']
    const trayBottom = parseFloat(tray.top) + parseFloat(tray.height)
    expect(parseFloat(kit.top)).toBeLessThan(trayBottom)
    expect(parseFloat(kit.top) + parseFloat(kit.height)).toBeGreaterThan(trayBottom)
    expect(beats[5]['hmp-tray']).toEqual(beats[2]['hmp-tray'])
    expect(treeKind('hmp-tray')).toBe('box')
    const verify = beats[6]['hmp-verify']
    expect(verify.top).toBe(beats[6]['hmp-card-1'].top)
    expect(parseFloat(verify.left)).toBeGreaterThan(parseFloat(beats[6]['hmp-card-4'].left))
  })

  it('draws the final frame around the whole accumulated diagram', () => {
    const frame = beats[8]['hmp-frame']
    const [fl, ft] = [parseFloat(frame.left), parseFloat(frame.top)]
    const [fr, fb] = [fl + parseFloat(frame.width), ft + parseFloat(frame.height)]
    for (const [id, e] of Object.entries(beats[8])) {
      if (id === 'hmp-frame' || e.width === '') continue
      const left = parseFloat(e.left)
      const top = parseFloat(e.top)
      expect(left).toBeGreaterThanOrEqual(fl)
      expect(top).toBeGreaterThanOrEqual(ft)
      expect(left + parseFloat(e.width)).toBeLessThanOrEqual(fr)
      expect(top + parseFloat(e.height)).toBeLessThanOrEqual(fb)
    }
  })
})

function treeKind(id: string): string | null {
  const { container } = render(<SampleScene payload={{ beat: 6 }} step={STEP_META[5]} index={5} count={9} mode="browse" />)
  const kind = container.querySelector(`[data-presentation-id="${id}"]`)?.getAttribute('data-presentation-node') ?? null
  cleanup()
  return kind
}

describe('unframed tray and exiting focus ring', () => {
  it('draws no border or frame treatment on the tray', () => {
    const css = readFileSync(path.resolve(import.meta.dirname, '../../src/presentations/how-to-make-a-presentation/talk.css'), 'utf8')
    const rule = css.match(/\[data-presentation-id='hmp-tray'\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(rule).toMatch(/border:\s*0/)
    expect(rule).not.toMatch(/dashed|solid/)
    for (const beat of [3, 6, 9]) {
      const { container } = render(<SampleScene payload={{ beat }} step={STEP_META[beat - 1]} index={beat - 1} count={9} mode="browse" />)
      const frames = [...container.querySelectorAll('[data-presentation-node="frame"]')].map((f) => f.getAttribute('data-presentation-id'))
      expect(frames).not.toContain('hmp-tray')
      cleanup()
    }
  })

  it('fades the focus ring out when it leaves on the final step instead of vanishing', async () => {
    const at = (beat: number) => (
      <SampleScene payload={{ beat }} step={STEP_META[beat - 1]} index={beat - 1} count={9} mode="browse" />
    )
    const { container, rerender } = render(at(8))
    expect(container.querySelector('[data-presentation-id="hmp-focus"]')).not.toBeNull()
    rerender(at(9))
    expect(container.querySelector('[data-presentation-id="hmp-focus"]')).not.toBeNull() // still exiting
    await waitFor(() => expect(container.querySelector('[data-presentation-id="hmp-focus"]')).toBeNull(), { timeout: 3000 })
  })
})
