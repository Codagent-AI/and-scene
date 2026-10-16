import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const skill = path.resolve(import.meta.dirname, '../../skills/presentation')
const md = readFileSync(path.join(skill, 'SKILL.md'), 'utf8')

describe('SKILL.md contract', () => {
  it('has distributable skill frontmatter', () => {
    expect(md).toMatch(/^---\nname: presentation\ndescription: .+\n---\n/)
  })

  it('gathers one question at a time, allows partial detail, and offers ASCII mockups', () => {
    expect(md).toMatch(/one at a time/i)
    expect(md).toMatch(/partial detail/i)
    expect(md).toMatch(/ASCII mockup/)
    expect(md).toMatch(/topic[\s\S]*visual style[\s\S]*visual description/i)
  })

  it('names the three anchors, target resolution, and confirmation before writes', () => {
    for (const anchor of ['Build setup', 'Scene kit', 'Presentation index']) expect(md).toContain(anchor)
    expect(md).toMatch(/presentations\//)
    expect(md).toMatch(/monorepo/i)
    expect(md).toMatch(/confirm/i)
    expect(md).toMatch(/only the missing/i)
  })

  it('resolves templates relative to the skill directory', () => {
    expect(md).toMatch(/relative to the\s+directory that contains this `SKILL.md`/)
    expect(md).toContain('templates/bootstrap/')
  })

  it('keeps styling out of the kit and defaults to plain CSS', () => {
    expect(md).toMatch(/plain CSS/)
    expect(md).toMatch(/Never edit the kit/)
    expect(md).toMatch(/no\*\* colors/)
  })

  it('handles ambiguous modification targets before editing', () => {
    expect(md).toMatch(/list the registered presentations/)
    expect(md).toMatch(/before changing\s+anything/)
  })

  it('requires build, render, visual checks, helper warnings review, and never reports failing success', () => {
    for (const phrase of ['npm run build', 'npm run verify', 'npm run inspect', 'first step, the last step', 'narrow', 'data-presentation-allow-overlap', 'Never report success']) {
      expect(md).toContain(phrase)
    }
    expect(md).toMatch(/under the\s+project root/)
  })

  it('only mentions "talk" as an informal synonym or the Talk.tsx filename', () => {
    for (const m of md.matchAll(/\b[Tt]alks?\b/g)) {
      const around = md.slice(Math.max(0, m.index - 60), m.index + 100)
      expect(around).toMatch(/Talk\.tsx|synonym|informal/)
    }
  })

  it('ships the referenced templates and helper', () => {
    for (const p of ['scripts/scaffold.mjs', 'templates/bootstrap/package.json', 'templates/bootstrap/package-lock.json', 'templates/presentation/Talk.tsx.tmpl']) {
      expect(existsSync(path.join(skill, p)), p).toBe(true)
    }
  })
})
