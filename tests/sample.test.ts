import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { presentations } from '../src/presentations'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { resolveRoute } from '../src/route'
import { REPO, isTest, walk } from './helpers'

// Independent copy of the normative table in specs/presentation-verification.
const NORMATIVE: [string, string, string][] = [
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
  it('implements the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(NORMATIVE)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })

  it('is registered and routable', () => {
    expect(presentations.map((p) => p.slug)).toContain('how-to-make-a-presentation')
    expect(resolveRoute('/how-to-make-a-presentation')?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(resolveRoute('/how-to-make-a-presentation/')?.slug).toBe('how-to-make-a-presentation')
    expect(resolveRoute('/')).toBeUndefined()
    expect(resolveRoute('/nope')).toBeUndefined()
  })

  it('shares one scene group and keeps entity ids unique and namespaced', async () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    const { ID } = await import('../src/presentations/how-to-make-a-presentation/entities')
    const ids = Object.values(ID)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((i) => i.startsWith('htm/'))).toBe(true)
  })

  it('verify.config.json matches the normative table', () => {
    const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'verify.config.json'), 'utf8'))
    expect(cfg.reference.steps.map((s: { title: string; caption: string }) => [s.title, s.caption])).toEqual(
      NORMATIVE.map(([, t, c]) => [t, c]),
    )
  })

  it('imports the kit only through its public entry point', () => {
    const files = walk(path.join(REPO, 'src/presentations'), (f) => /\.tsx?$/.test(f))
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8')
      for (const m of src.matchAll(/from '([^']*presentation-kit[^']*)'/g)) {
        expect(m[1], f).toMatch(/presentation-kit$/)
      }
    }
  })
})

describe('style-neutral kit', () => {
  const kit = walk(path.join(REPO, 'src/presentation-kit'), (f) => !isTest(f))

  it('ships no stylesheets and no styling framework', () => {
    expect(kit.filter((f) => /\.(css|scss|less)$/.test(f))).toEqual([])
    const pkg = fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind|styled-components|emotion/)
    for (const f of kit) expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/tailwind|styled-components|@emotion/i)
  })

  it('declares no colors, fonts, borders or shadows', () => {
    for (const f of kit) {
      const src = fs.readFileSync(f, 'utf8')
      expect(src, f).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|fontFamily|fontSize|boxShadow|borderRadius|border:|background|color:/i)
    }
  })
})
