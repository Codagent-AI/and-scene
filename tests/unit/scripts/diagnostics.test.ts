import { mkdirSync, mkdtempSync, readFileSync, symlinkSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  activeChromeWarnings,
  activeIsDistinct,
  attributionWarnings,
  DEFAULT_SETTLE_MS,
  formatWarning,
  inspectExitCode,
  inspectionDir,
  intersectionArea,
  MIN_ATTRIBUTION_FONT_PX,
  overlapWarnings,
  stepFileName,
} from '../../../scripts/lib/diagnostics.mjs'

const item = (id: string, x: number, y: number, w: number, h: number, extra: object = {}) => ({ id, rect: { x, y, w, h }, allowed: false, nested: [], ...extra })

describe('overlap warnings (L-71, L-72)', () => {
  it('computes intersection area', () => {
    expect(intersectionArea({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(25)
    expect(intersectionArea({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 5, h: 5 })).toBe(0)
  })

  it('warns with the step and both elements for an unmarked collision', () => {
    const [w] = overlapWarnings([item('<p> "Title"', 0, 0, 100, 20), item('<a data-presentation-attribution>', 50, 5, 100, 20)], 3)
    expect(w).toMatchObject({ step: 3, kind: 'overlap' })
    expect(w.message).toContain('<p> "Title"')
    expect(w.message).toContain('<a data-presentation-attribution>')
    expect(formatWarning(w)).toMatch(/^WARN step 04 overlap:/)
  })

  it('ignores touching and tiny overlaps', () => {
    expect(overlapWarnings([item('a', 0, 0, 10, 10), item('b', 10, 0, 10, 10)], 0)).toEqual([])
    expect(overlapWarnings([item('a', 0, 0, 10, 10), item('b', 8, 8, 2, 2)], 0)).toEqual([]) // 4px²
    expect(overlapWarnings([item('a', 0, 0, 10, 10), item('b', 7, 7, 3, 3)], 0)).toHaveLength(1) // 9px²
  })

  it('reports nested elements whose own text collides: only the marker exempts', () => {
    // `rect` is each element's own-text range, so ancestor/descendant pairs are measured like any other
    expect(overlapWarnings([item('<div> "Outer"', 0, 0, 100, 20), item('<span> "Inner"', 5, 2, 40, 16)], 1)).toHaveLength(1)
    expect(overlapWarnings([item('<div> "Outer"', 0, 0, 100, 20), item('<span> "Inner"', 5, 2, 40, 16, { allowed: true })], 1)).toEqual([])
  })

  it('reports a painted box that hides another element\'s text its own text does not reach (F-4)', () => {
    const chip = item('<span data-role="edited"> "edited"', 522, 427, 45, 18, { index: 0, cover: { x: 500, y: 424, w: 80, h: 24 }, within: [], above: [1] })
    const word = item('<span data-part="visual"> "visual"', 476, 427, 39, 18, { index: 1, within: [] })
    const [w] = overlapWarnings([chip, word], 7)
    expect(w).toMatchObject({ step: 7, kind: 'overlap' })
    expect(w.message).toContain('data-role="edited"')
    expect(w.message).toContain('data-part="visual"')
    expect(overlapWarnings([{ ...chip, allowed: true }, word], 7)).toEqual([])
  })

  it('does not report text that is painted on top of a filled box beside it', () => {
    const shape = item('<div data-role="shape"> "shape"', 522, 427, 45, 18, { index: 0, cover: { x: 470, y: 420, w: 120, h: 40 }, within: [], above: [] })
    const label = item('<span data-role="label"> "label"', 476, 427, 39, 18, { index: 1, within: [] })
    expect(overlapWarnings([shape, label], 7)).toEqual([])
  })

  it('does not treat a box as covering the text inside it, or a box that misses the text', () => {
    const outer = item('<div> "Outer"', 0, 0, 40, 10, { index: 0, cover: { x: 0, y: 0, w: 200, h: 100 }, within: [], above: [1] })
    const inner = item('<span> "Inner"', 100, 50, 40, 10, { index: 1, within: [0] })
    expect(overlapWarnings([outer, inner], 1)).toEqual([])
    const far = item('<p> "Far"', 300, 300, 40, 10, { index: 2, within: [] })
    expect(overlapWarnings([outer, far], 1)).toEqual([])
  })

  it('exempts allowed subtrees but still reports unrelated collisions', () => {
    const items = [
      item('socket', 0, 0, 50, 20, { allowed: true }),
      item('socket child', 10, 5, 20, 10, { allowed: true }),
      item('tray', 40, 10, 50, 20),
      item('x', 200, 0, 50, 20),
      item('y', 220, 5, 50, 20),
    ]
    const warnings = overlapWarnings(items, 5)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toMatch(/x overlaps y/)
  })
})

const base = { color: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)', borderColor: 'rgb(0, 0, 0)', borderWidth: '1px', opacity: '1', width: '14px', height: '14px', fontWeight: '400' }

describe('active chrome (L-73)', () => {
  it.each(['color', 'backgroundColor', 'borderColor', 'borderWidth', 'opacity', 'width', 'height', 'fontWeight'])(
    'is distinct when only %s differs',
    (field) => {
      expect(activeIsDistinct({ ...base, [field]: 'different' }, base)).toBe(true)
    },
  )

  it('warns per chrome kind when active and inactive look identical', () => {
    const w = activeChromeWarnings(
      [
        { name: 'progress indicator', active: base, inactive: { ...base } },
        { name: 'table-of-contents entry', active: { ...base, fontWeight: '700' }, inactive: base },
        { name: 'absent', active: null, inactive: null },
      ],
      2,
    )
    expect(w).toHaveLength(1)
    expect(w[0]).toMatchObject({ step: 2, kind: 'active-chrome' })
    expect(w[0].message).toMatch(/progress indicator/)
  })
})

describe('attribution (L-74)', () => {
  const ok = { fontSizePx: 13, color: 'rgb(154, 168, 196)', textDecoration: 'none' }
  it('is quiet for a styled, legible attribution', () => {
    expect(attributionWarnings(ok, 0)).toEqual([])
  })

  it('warns under the minimum size, pointing at the styling hook', () => {
    expect(attributionWarnings({ ...ok, fontSizePx: MIN_ATTRIBUTION_FONT_PX - 1 }, 1)[0].message).toContain('data-presentation-attribution')
    expect(attributionWarnings({ ...ok, fontSizePx: MIN_ATTRIBUTION_FONT_PX }, 1)).toEqual([])
  })

  it('warns for the browser-default blue underlined link but not for blue without underline', () => {
    const def = { fontSizePx: 16, color: 'rgb(0, 0, 238)', textDecoration: 'underline' }
    expect(attributionWarnings(def, 0)).toHaveLength(1)
    expect(attributionWarnings({ ...def, textDecoration: 'none' }, 0)).toEqual([])
    expect(attributionWarnings({ ...def, color: 'rgb(1, 2, 3)' }, 0)).toEqual([])
  })

  it('warns when attribution is missing', () => {
    expect(attributionWarnings(null, 0)[0].message).toMatch(/missing/)
  })
})

describe('artifacts and exit status (I-44, L-69, L-70)', () => {
  it('names one predictable file per step', () => {
    expect(stepFileName(0)).toBe('step-01.png')
    expect(stepFileName(8)).toBe('step-09.png')
    expect(stepFileName(11)).toBe('step-12.png')
  })

  it('exits zero with warnings and non-zero only on operational failure', () => {
    expect(inspectExitCode({ failure: false })).toBe(0)
    expect(inspectExitCode({ failure: true })).toBe(1)
  })

  it('defaults to a 1200ms settle wait that is overridable', () => {
    expect(DEFAULT_SETTLE_MS).toBe(1200)
    expect(readFileSync('scripts/inspect-presentation.mjs', 'utf8')).toMatch(/--settle=/)
  })

  it('waits for the settle interval after navigation and before the screenshot, for every step', () => {
    const code = readFileSync('scripts/inspect-presentation.mjs', 'utf8')
    const navigate = code.indexOf("keyboard.press('ArrowRight')")
    const settle = code.indexOf('waitForTimeout(args.settleMs)')
    const shot = code.indexOf('page.screenshot')
    expect(navigate).toBeGreaterThan(-1)
    expect(settle).toBeGreaterThan(navigate)
    expect(shot).toBeGreaterThan(settle)
    // the wait sits outside the `if (i > 0)` block, so the first step settles too
    expect(code.slice(navigate, settle)).toMatch(/\}\s*await page\.$/)
  })

  it('writes screenshots below the project root, one directory per slug', () => {
    const code = readFileSync('scripts/inspect-presentation.mjs', 'utf8')
    expect(code).toMatch(/inspectionDir\(root, args\.slug/)
    expect(code).toMatch(/1280, height: 720/)
  })
})

describe('inspection output directory (L-69)', () => {
  it('stays inside <root>/inspection for valid slugs', () => {
    expect(inspectionDir('/proj', 'my-talk')).toBe('/proj/inspection/my-talk')
    expect(inspectionDir('/proj', 'my-talk', true)).toBe('/proj/inspection/my-talk-narrow')
  })

  it.each(['../src', '..', '.', 'a/b', '/etc', 'a/../../src', '', 'UPPER', 'x y', '-lead'])('refuses %j', (slug) => {
    expect(() => inspectionDir('/proj', slug)).toThrow(/invalid presentation slug/)
  })
})

describe('symlinked inspection directory (L-69)', () => {
  it('refuses to use an inspection/ symlink', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'insp-'))
    const elsewhere = mkdtempSync(path.join(os.tmpdir(), 'insp-out-'))
    mkdirSync(path.join(elsewhere, 'x'))
    symlinkSync(elsewhere, path.join(root, 'inspection'), 'dir')
    expect(() => inspectionDir(root, 'x')).toThrow(/symlink/)
  })
})
