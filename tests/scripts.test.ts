import { describe, test, expect } from 'vitest'
import { join } from 'node:path'
import {
  chooseTarget,
  missingAnchors,
  needsConfirmation,
  bootstrapDirectory,
  skillDirectory,
} from '../skills/presentation/scaffold.mjs'
import { assertNoErrors } from '../scripts/validation.mjs'
import { diagnose, overlaps } from '../scripts/diagnostics.mjs'

const rect = { left: 0, top: 0, right: 100, bottom: 20 }
const attribution = { visible: true, fontSize: 12, browserDefault: false }
const text = (name: string, allowed = false, visible = true) => ({
  name,
  rect,
  allowed,
  visible,
})
describe('scaffolding and diagnostics', () => {
  test('I-2 anchor selections reuse full infrastructure and preserve partial anchors', () => {
    expect(missingAnchors({ build: true, kit: true, index: true })).toEqual([])
    expect(missingAnchors({ build: true, kit: false, index: false })).toEqual([
      'kit',
      'index',
    ])
    expect(missingAnchors({ build: false, kit: false, index: false })).toEqual([
      'build',
      'kit',
      'index',
    ])
  })
  test('I-3 standalone/monorepo targets, existing apps and nonempty confirmation', () => {
    const anchors = { build: true, kit: false, index: false }
    expect(chooseTarget({ root: '/project', anchors, monorepo: false })).toBe(
      '/project',
    )
    expect(chooseTarget({ root: '/project', anchors, monorepo: true })).toBe(
      '/project/presentations',
    )
    expect(
      chooseTarget({
        root: '/project',
        anchors: { ...anchors, kit: true },
        monorepo: true,
      }),
    ).toBe('/project')
    expect(needsConfirmation(true, anchors)).toBe(true)
    expect(needsConfirmation(false, anchors)).toBe(false)
    expect(
      needsConfirmation(true, { build: true, kit: true, index: true }),
    ).toBe(false)
  })
  test('I-4 template paths anchored to the skill module', () => {
    expect(bootstrapDirectory).toBe(join(skillDirectory, 'templates/bootstrap'))
    expect(skillDirectory).toMatch(/skills\/presentation$/)
  })
  test('I-35 console/page error attribution names failing step', () => {
    expect(() => assertNoErrors([], 3)).not.toThrow()
    expect(() => assertNoErrors(['console failure'], 3)).toThrow(
      'render failed at step 3: console failure',
    )
    expect(() => assertNoErrors(['uncaught page failure'], 0)).toThrow(
      'step 0: uncaught page failure',
    )
  })
  test('I-39 visible overlaps warn, hidden/allowed subtrees and disjoint text are exempt', () => {
    expect(overlaps(rect, { left: 101, right: 120, top: 0, bottom: 20 })).toBe(
      false,
    )
    expect(
      diagnose(
        { texts: [text('A'), text('B')], navigation: [], attribution },
        4,
      ),
    ).toEqual(['step 4: overlap A / B'])
    for (const second of [text('B', true), text('B', false, false)])
      expect(
        diagnose(
          { texts: [text('A'), second], navigation: [], attribution },
          4,
        ),
      ).toEqual([])
    expect(diagnose({ texts: [], navigation: [], attribution }, 0)).toEqual([])
  })
  test('I-40 indistinct progress and ToC warn while distinct states pass', () => {
    const navigation = ['progress', 'toc'].map((name) => ({
      name,
      active: 'same',
      inactive: ['same'],
    }))
    expect(diagnose({ texts: [], navigation, attribution }, 2)).toEqual([
      'step 2: indistinct active progress',
      'step 2: indistinct active toc',
    ])
    expect(
      diagnose(
        {
          texts: [],
          navigation: [
            { name: 'toc', active: 'distinct', inactive: ['other'] },
          ],
          attribution,
        },
        2,
      ),
    ).toEqual([])
  })
  test('I-41 missing, hidden, undersized and browser-default attribution warn with styling hook', () => {
    for (const bad of [
      null,
      { ...attribution, visible: false },
      { ...attribution, fontSize: 9 },
      { ...attribution, browserDefault: true },
    ]) {
      expect(
        diagnose({ texts: [], navigation: [], attribution: bad }, 1),
      ).toEqual([
        'step 1: style [data-presentation-attribution] for legible attribution',
      ])
    }
    expect(diagnose({ texts: [], navigation: [], attribution }, 1)).toEqual([])
  })
})
