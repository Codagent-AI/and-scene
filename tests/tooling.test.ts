import { describe, it, expect } from 'vitest'
import { validateReference } from '../scripts/verify.mjs'
import { chromeWarnings, intersects, overlapWarnings } from '../scripts/diagnostics.mjs'
import { parseOptions } from '../scripts/browser.mjs'
import reference from '../scripts/reference.json'

describe('verification and inspection logic', () => {
  it('I-45 malformed missing reordered and unregistered reference data fail', () => {
    expect(() => validateReference(reference, reference, true)).not.toThrow()
    expect(() => validateReference(reference.map(({ caption, title, era, id }) => ({ caption, title, era, id })), reference, true)).not.toThrow()
    expect(() => validateReference(reference.map(s => ({ ...s, id: 'duplicate' })), reference, true)).toThrow('reference')
    for (const value of [undefined, [], [...reference].reverse(), reference.map((s, i) => i ? s : { ...s, title: 'wrong' })]) expect(() => validateReference(value, reference, true)).toThrow('reference')
    expect(() => validateReference(reference, reference, false)).toThrow('not registered')
  })
  it('I-51 settle configuration accepts zero/custom intervals and rejects invalid options', () => {
    expect(parseOptions(['example']).settle).toBe(1000)
    expect(parseOptions(['example', '--settle', '200']).settle).toBe(200)
    expect(parseOptions(['example', '--settle', '0']).settle).toBe(0)
    for (const args of [['--settle', '-1'], ['--settle', 'x'], ['--width', '0'], ['--height', 'x'], ['--unknown'], ['../escape']]) expect(() => parseOptions(args)).toThrow()
  })
  it('I-52 overlap diagnostics distinguish hidden allowed related and separate elements', () => {
    const rect = { left: 0, top: 0, right: 100, bottom: 30 }
    const a = { key: 'a', label: 'first', ancestors: [], visible: true, allowed: false, rect }
    const b = { ...a, key: 'b', label: 'second' }
    expect(overlapWarnings([a, b])).toEqual(['overlap: first / second'])
    expect(overlapWarnings([a, { ...b, allowed: true }])).toEqual([])
    expect(overlapWarnings([a, { ...b, visible: false }])).toEqual([])
    expect(overlapWarnings([a, { ...b, ancestors: ['a'] }])).toEqual([])
    expect(intersects(rect, { left: 100, top: 0, right: 200, bottom: 30 })).toBe(false)
  })
  it('I-53 chrome diagnostics cover indistinct active state and each attribution defect', () => {
    const good = { visible: true, size: 12, browserDefault: false }
    expect(chromeWarnings({ groups: { progress: { active: 'a', inactive: 'b' } }, attribution: good })).toEqual([])
    for (const attribution of [null, { ...good, visible: false }, { ...good, size: 10 }, { ...good, browserDefault: true }]) expect(chromeWarnings({ groups: {}, attribution })[0]).toContain('[data-presentation-attribution] a')
    expect(chromeWarnings({ groups: { progress: { active: 'same', inactive: 'same' }, 'toc-entry': { active: 'same', inactive: 'same' } }, attribution: good })).toEqual(['indistinct active progress', 'indistinct active toc-entry'])
  })
})
