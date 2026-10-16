import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PRESENTATIONS } from '../../src/presentations'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/steps/SampleScene'

afterEach(cleanup)
const config = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../../scripts/verify.config.json'), 'utf8'))
const outline = config.required[0]

describe('registry', () => {
  it('has unique slugs and lazy loaders', () => {
    const slugs = PRESENTATIONS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of PRESENTATIONS) expect(typeof p.load).toBe('function')
  })

  it('registers the reference sample under its slug', () => {
    const entry = PRESENTATIONS.find((p) => p.slug === outline.slug)
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(entry?.title).toBe(outline.title)
  })

  it('loads the sample entry component', async () => {
    const mod = await PRESENTATIONS[0].load()
    expect(typeof mod.default).toBe('function')
  })
})

describe('reference sample outline', () => {
  it('implements nine steps with the normative titles and captions in order', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map((s) => ({ title: s.title, caption: s.caption }))).toEqual(outline.steps)
  })

  it('labels the steps with the five eras from the outline', () => {
    expect(STEPS.map((s) => s.era)).toEqual([
      'the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering', 'the build', 'the build', 'the loop', 'the reveal',
    ])
  })

  it('has unique step ids and shares one scene group', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('accumulates entities: nothing present in one step disappears in the next', () => {
    const ids = (n: number) =>
      new Set([...render(<SampleScene payload={{ n }} index={n - 1} />).container.querySelectorAll('[data-presentation-id]')].map((e) => e.getAttribute('data-presentation-id')))
    let previous = new Set<string | null>()
    for (let n = 1; n <= 9; n++) {
      const current = ids(n)
      cleanup()
      for (const id of previous) expect(current.has(id), `step ${n} lost ${id}`).toBe(true)
      expect(current.size).toBeGreaterThan(previous.size - 1)
      previous = current
    }
  })

  it('introduces the normative scene content at the right beats', () => {
    const has = (n: number, id: string) => {
      const found = render(<SampleScene payload={{ n }} index={n - 1} />).container.querySelector(`[data-presentation-id="${id}"]`) !== null
      cleanup()
      return found
    }
    expect([has(1, 'htmp-you'), has(1, 'htmp-prompt'), has(1, 'htmp-skill')]).toEqual([true, true, false])
    expect([has(2, 'htmp-skill'), has(2, 'htmp-conversation'), has(2, 'htmp-question')]).toEqual([true, true, true])
    expect([has(3, 'htmp-tray'), has(3, 'htmp-card-1'), has(3, 'htmp-card-2')]).toEqual([true, true, false])
    expect([has(4, 'htmp-card-4'), has(4, 'htmp-ghost')]).toEqual([true, false])
    expect([has(5, 'htmp-ghost'), has(5, 'htmp-depth')]).toEqual([true, true])
    expect([has(6, 'htmp-scene-kit'), has(6, 'htmp-verify')]).toEqual([true, false])
    expect([has(7, 'htmp-verify'), has(7, 'htmp-check'), has(7, 'htmp-chain')]).toEqual([true, true, true])
    expect([has(8, 'htmp-modify'), has(8, 'htmp-edited'), has(8, 'htmp-frame')]).toEqual([true, true, false])
    expect(has(9, 'htmp-frame')).toBe(true)
  })

  it('imports only the kit public API', () => {
    const dir = path.resolve(import.meta.dirname, '../../src/presentations/how-to-make-a-presentation')
    for (const f of ['Talk.tsx', 'steps/SampleScene.tsx', 'entities.ts']) {
      const src = readFileSync(path.join(dir, f), 'utf8')
      for (const m of src.matchAll(/from '((?:\.\.\/)+presentation-kit[^']*)'/g)) {
        expect(m[1]).toMatch(/presentation-kit$/)
      }
    }
  })
})
