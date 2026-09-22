import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('reference presentation contract', () => {
  it('registers the canonical nine step titles and captions in order', () => {
    const talk = readFileSync(resolve(process.cwd(), 'src/presentations/how-to-make-a-presentation/Talk.tsx'), 'utf8')
    const registry = readFileSync(resolve(process.cwd(), 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'how-to-make-a-presentation'")
    for (const [title, caption] of [
      ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
      ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
      ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
      ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
      ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
      ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
      ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
      ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
      ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
    ]) { expect(talk).toContain(title); expect(talk).toContain(caption) }
    expect(talk.match(/\['the [^\]]+\]/g)).toHaveLength(9)
  })

  it('passes the registered sample through the production browser journey (E2E-001)', () => {
    const output = execFileSync(process.execPath, [resolve(process.cwd(), 'scripts/verify.mjs')], { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe', timeout: 120000 })
    expect(output).toContain('PASS: canonical 9-step sample is registered and ordered')
    expect(output).toMatch(/PASS: production preview rendered all 9 steps without browser errors \(http:\/\/127\.0\.0\.1:/)
    expect(output).toContain('PASS: npm run verify')
  }, 150000)
})
