import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STEPS } from '.'

const config = JSON.parse(readFileSync('package.json', 'utf8')).presentationVerification.reference

describe('how-to-make-a-presentation steps', () => {
  it('has nine steps with unique ids', () => {
    expect(STEPS).toHaveLength(9)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })
  it('matches the normative titles and captions in order (verify config)', () => {
    expect(STEPS.map(({ title, caption }) => ({ title, caption }))).toEqual(config.steps)
    expect(config.slug).toBe('how-to-make-a-presentation')
  })
  it('uses the normative eras', () => {
    expect(STEPS.map((s) => s.era)).toEqual([
      'the ask', 'the ask',
      'the gathering', 'the gathering', 'the gathering',
      'the build', 'the build',
      'the loop',
      'the reveal',
    ])
  })
  it('shares one scene group so entities morph instead of remounting', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(STEPS[0].groupKey).toBeDefined()
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.stage)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
