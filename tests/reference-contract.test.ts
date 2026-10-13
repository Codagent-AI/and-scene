import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { presentations } from '../src/presentations'

it('keeps the worked scene and verification config aligned with the canonical outline', () => {
  const spec = readFileSync('openspec/changes/create-and-scene/specs/presentation-verification/spec.md', 'utf8')
  const outline = spec.split('\n').filter(line => /^\| [1-9] \|/.test(line)).map(line => {
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim())
    return { era: cells[1], title: cells[2].replace(/^"|"$/g, ''), caption: cells[3] }
  })
  expect(outline).toHaveLength(9)
  expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(outline)
  expect(new Set(STEPS.map(step => step.id)).size).toBe(9)
  expect(new Set(STEPS.map(step => step.Scene)).size).toBe(1)
  expect(new Set(STEPS.map(step => step.groupKey))).toEqual(new Set(['conversation']))
  expect(STEPS.map(step => step.payload.beat)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  expect(presentations.find(entry => entry.slug === 'how-to-make-a-presentation')?.title).toBe('How to Use This Skill to Make a Presentation')
  const config = JSON.parse(readFileSync('verify.config.json', 'utf8'))
  expect(config.referencePresentations).toEqual([{
    slug: 'how-to-make-a-presentation', steps: outline.map(({ title, caption }) => ({ title, caption })),
  }])
})

it('distributes the identical project-agnostic verifier with no mandatory reference sample', () => {
  expect(readFileSync('skills/presentation/templates/bootstrap/scripts/verify.mjs', 'utf8')).toBe(readFileSync('scripts/verify.mjs', 'utf8'))
  expect(JSON.parse(readFileSync('skills/presentation/templates/bootstrap/verify.config.json', 'utf8'))).toEqual({ referencePresentations: [] })
})
