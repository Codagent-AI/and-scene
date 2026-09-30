import { existsSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { presentations } from '../src/presentations'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/Talk'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'

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
] as const

describe('reference presentation', () => {
  it('registers the canonical nine-step, self-referential sample in order', () => {
    expect(presentations).toContainEqual({
      slug: 'how-to-make-a-presentation',
      title: 'How to Use This Skill to Make a Presentation',
      load: expect.any(Function),
    })
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => [era, title, caption])).toEqual(outline)
    expect(new Set(STEPS.map(({ groupKey }) => groupKey))).toEqual(new Set(['how-to-make-a-presentation-scene']))
  })

  it('ships deterministic root verification and inspection commands', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }

    expect(packageJson.scripts.verify).toBe('node scripts/verify.mjs')
    expect(packageJson.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
    expect(existsSync('scripts/verify.mjs')).toBe(true)
    expect(existsSync('scripts/inspect-presentation.mjs')).toBe(true)

    const verifier = readFileSync('scripts/verify.mjs', 'utf8')
    expect(verifier).toContain("const host = '127.0.0.1'")
    expect(verifier).toContain("const canonicalSlug = 'how-to-make-a-presentation'")
    expect(verifier).toContain('data-step-count')
    expect(verifier).toContain('data-step-index')
    expect(verifier).toContain('VERIFY PASS:')
  })

  it('keeps the tray absent until answers become steps', () => {
    const firstBeat = renderToStaticMarkup(createElement(Scene, { payload: STEPS[0].payload, step: STEPS[0], stepIndex: 0 }))
    const thirdBeat = renderToStaticMarkup(createElement(Scene, { payload: STEPS[2].payload, step: STEPS[2], stepIndex: 2 }))

    expect(firstBeat).not.toContain('sample-card')
    expect(thirdBeat).toContain('sample-card')
  })
})
