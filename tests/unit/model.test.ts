import { describe, expect, it } from 'vitest'
import {
  DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT,
} from '../../src/presentation-kit/constants.ts'
import { eraSections, formatMarker, sceneKey, sectionIndexOf, stepNumber } from '../../src/presentation-kit/steps.ts'
import { computeFitScale } from '../../src/presentation-kit/useFitScale.ts'
import { actionForKey, actionForSwipe, isInteractiveTarget } from '../../src/presentation-kit/usePresentationNav.ts'
import { OtherScene, makeSteps } from './helpers.tsx'

describe('step model', () => {
  it('derives on-screen numbers from position after insert, remove, and reorder', () => {
    const steps = makeSteps(3)
    const markers = (list: typeof steps) => list.map((_, i) => formatMarker(i, list.length))
    expect(markers(steps)).toEqual(['1 / 3', '2 / 3', '3 / 3'])
    const reordered = [steps[2], steps[0], steps[1]]
    expect(reordered.map((s) => s.id)).toEqual(['s-2', 's-0', 's-1'])
    expect(markers(reordered)).toEqual(['1 / 3', '2 / 3', '3 / 3'])
    const inserted = [steps[0], { ...steps[1], id: 'new' }, steps[1], steps[2]]
    expect(markers(inserted)).toEqual(['1 / 4', '2 / 4', '3 / 4', '4 / 4'])
    expect(markers(steps.slice(1))).toEqual(['1 / 2', '2 / 2'])
    expect(stepNumber(0)).toBe(1)
  })

  it('groups consecutive steps of an era, including an era not starting at zero', () => {
    const sections = eraSections(makeSteps(5, { eras: (i) => ['a', 'a', 'b', 'b', 'c'][i] }))
    expect(sections).toEqual([
      { era: 'a', firstIndex: 0, indices: [0, 1] },
      { era: 'b', firstIndex: 2, indices: [2, 3] },
      { era: 'c', firstIndex: 4, indices: [4] },
    ])
    expect(sectionIndexOf(sections, 3)).toBe(1)
  })

  it('shares a scene key only for the same group and the same Scene', () => {
    const [a, b] = makeSteps(2)
    expect(sceneKey(a)).toBe(sceneKey(b))
    expect(sceneKey({ ...b, groupKey: 'other' })).not.toBe(sceneKey(a))
    expect(sceneKey({ ...b, Scene: OtherScene })).not.toBe(sceneKey(a))
    const ungrouped = makeSteps(2, { group: () => undefined })
    expect(sceneKey(ungrouped[0])).not.toBe(sceneKey(ungrouped[1]))
  })
})

describe('canvas and timing constants', () => {
  it('defaults to an 880 x 380 canvas', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })

  it('delays newcomers until persisting entities finish their layout morph', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_T).toBeGreaterThan(0)
  })
})

describe('computeFitScale', () => {
  it('fits uniformly by the tighter axis between the chrome of each mode', () => {
    for (const mode of ['browse', 'present'] as const) {
      const l = STAGE_LAYOUT[mode]
      const toc = mode === 'browse' ? l.toc : 0
      const wide = computeFitScale(1600, 700, mode)
      expect(wide).toBeCloseTo((700 - l.top - l.bottom) / DESIGN_H)
      expect(computeFitScale(1200, 2000, mode)).toBeCloseTo((1200 - toc - 2 * l.side) / DESIGN_W)
    }
  })

  it('drops the table-of-contents reserve below the wide breakpoint', () => {
    const l = STAGE_LAYOUT.browse
    expect(computeFitScale(WIDE_VIEWPORT - 1, 2000, 'browse')).toBeCloseTo((WIDE_VIEWPORT - 1 - 2 * l.side) / DESIGN_W)
    expect(computeFitScale(WIDE_VIEWPORT, 2000, 'browse')).toBeCloseTo((WIDE_VIEWPORT - l.toc - 2 * l.side) / DESIGN_W)
  })

  it('differs by mode geometry, honours the floor, and accepts a custom canvas', () => {
    expect(computeFitScale(1400, 600, 'present')).not.toBe(computeFitScale(1400, 600, 'browse'))
    expect(computeFitScale(100, 100, 'browse')).toBe(MIN_SCALE)
    expect(computeFitScale(1600, 900, 'present', { width: 440, height: 190 })).toBeGreaterThan(computeFitScale(1600, 900, 'present'))
  })
})

describe('navigation inputs', () => {
  it('maps keys to actions', () => {
    for (const k of ['ArrowRight', ' ', 'PageDown']) expect(actionForKey(k)).toBe('next')
    for (const k of ['ArrowLeft', 'PageUp']) expect(actionForKey(k)).toBe('prev')
    expect(actionForKey('p')).toBe('toggle-mode')
    expect(actionForKey('P')).toBe('toggle-mode')
    expect(actionForKey('x')).toBeUndefined()
  })

  it('maps swipes: left advances, right goes back, short and vertical ignored', () => {
    expect(actionForSwipe(-80, 5)).toBe('next')
    expect(actionForSwipe(80, -5)).toBe('prev')
    expect(actionForSwipe(-49, 0)).toBeUndefined()
    expect(actionForSwipe(-50, 0)).toBe('next')
    expect(actionForSwipe(-60, 90)).toBeUndefined()
    expect(actionForSwipe(60, 60)).toBeUndefined()
  })

  it('treats buttons, links, form fields, editables, and their children as controls', () => {
    const html = `<button><span id="in-button"></span></button><a href="/x">l</a><input><textarea></textarea><select></select>
      <div contenteditable="true" id="ce"></div><div role="button" id="rb"></div><div role="checkbox" id="cb"></div><div role="tab" id="tb"></div><div role="menuitem" id="mi"></div><p id="plain"></p>`
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.append(host)
    for (const sel of ['button', '#in-button', 'a', 'input', 'textarea', 'select', '#ce', '#rb', '#cb', '#tb', '#mi']) {
      expect(isInteractiveTarget(host.querySelector(sel)), sel).toBe(true)
    }
    expect(isInteractiveTarget(host.querySelector('#plain'))).toBe(false)
    expect(isInteractiveTarget(document.body)).toBe(false)
    expect(isInteractiveTarget(window)).toBe(false)
    host.remove()
  })
})
