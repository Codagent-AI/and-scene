import { describe, expect, it } from 'vitest'
import { computeScale } from '../../src/presentation-kit/fitScale.ts'
import { ENTITIES, visibleAt } from '../../src/presentations/how-to-make-a-presentation/entities.ts'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps/index.ts'
import { PRESENTATIONS } from '../../src/presentations/index.ts'
import { read } from './helpers.ts'

// Normative text from presentation-verification/spec.md, "Committed reference sample".
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

describe('reference sample', () => {
  it('is registered under its slug with the normative presentation title', () => {
    expect(PRESENTATIONS.find((e) => e.slug === 'how-to-make-a-presentation')?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('has the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(SPEC.map((s) => [...s]))
  })

  it('has the same expectations in the verification config', () => {
    const { slug, steps } = JSON.parse(read('scripts/verify.config.json')).referenceSample
    expect(slug).toBe('how-to-make-a-presentation')
    expect(steps.map((s: { era: string; title: string; caption: string }) => [s.era, s.title, s.caption])).toEqual(SPEC.map((s) => [...s]))
  })

  it('shares one scene group across all steps so the scene persists', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })

  it('accumulates entities: ids are unique, and later steps only add', () => {
    expect(new Set(ENTITIES.map((e) => e.id)).size).toBe(ENTITIES.length)
    for (let i = 1; i < 9; i++) {
      const before = visibleAt(i - 1).map((e) => e.id)
      expect(visibleAt(i).map((e) => e.id)).toEqual(expect.arrayContaining(before))
    }
    expect(visibleAt(0).map((e) => e.id)).toEqual(['you', 'prompt'])
  })

  it.each([
    [2, ['skill', 'you-skill', 'question-chip']],
    [3, ['tray', 'card-1']],
    [4, ['card-2', 'card-3']],
    [5, ['ghost-card', 'depth-control']],
    [6, ['scene-kit']],
    [7, ['verify', 'verify-check']],
    [8, ['modify-arc', 'edited-ring']],
    [9, ['reveal-frame']],
  ])('step %i introduces its scene content', (step, ids) => {
    const introduced = ENTITIES.filter((e) => e.step === step).map((e) => e.id)
    expect(introduced).toEqual(expect.arrayContaining(ids))
  })

  it('draws the tray without a frame at step 6, chains verify into the tray row, and frames everything at the end', () => {
    const byId = Object.fromEntries(ENTITIES.map((e) => [e.id, e]))
    expect(byId['scene-kit'].at!.y).toBe(byId.tray.at!.y + byId.tray.at!.h)
    expect(byId.verify.at!.y).toBe(byId['card-1'].at!.y)
    expect(byId['verify-check'].state).toBe('pass')
    const frame = byId['reveal-frame'].at!
    for (const e of ENTITIES.filter((x) => x.at && x.id !== 'reveal-frame' && x.id !== 'reveal-label')) {
      expect(e.at!.x).toBeGreaterThanOrEqual(frame.x)
      expect(e.at!.x + (e.at!.w ?? 0)).toBeLessThanOrEqual(frame.x + frame.w!)
      expect(e.at!.y + (e.at!.h ?? 0)).toBeLessThanOrEqual(frame.y + frame.h!)
    }
  })

  it('keeps entities on the 880 x 380 canvas', () => {
    for (const e of ENTITIES.filter((x) => x.at)) {
      expect(e.at!.x + (e.at!.w ?? 0), e.id).toBeLessThanOrEqual(880)
      expect(e.at!.y + (e.at!.h ?? 0), e.id).toBeLessThanOrEqual(380)
    }
  })
})

describe('reference sample legibility on a narrow viewport', () => {
  // The fixed 880 x 380 canvas is scaled uniformly, so a 390 px phone shows scene text at ~0.4x.
  const MIN_EFFECTIVE_PX = 9

  it('declares scene text large enough to stay readable after fit scaling at 390 x 844', () => {
    const scale = computeScale(390, 844, 'browse')
    const css = read('src/presentations/how-to-make-a-presentation/styles.css')
    const sizes: { selector: string; px: number }[] = []
    for (const [, selector, body] of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
      if (!/\.ent|data-presentation-node=|box-label/.test(selector)) continue
      const px = /font-size:\s*([\d.]+)px/.exec(body)
      if (px) sizes.push({ selector: selector.trim(), px: Number(px[1]) })
    }
    expect(sizes.length).toBeGreaterThan(5)
    for (const { selector, px } of sizes) expect(px * scale, selector).toBeGreaterThanOrEqual(MIN_EFFECTIVE_PX)
  })
})
