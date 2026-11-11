import { describe, expect, it } from 'vitest'
import { EventEmitter } from 'node:events'
import { diagnose, intersects } from '../scripts/diagnostics.mjs'
import { watchErrors } from '../scripts/browser.mjs'
const rect = { left: 0, top: 0, right: 20, bottom: 20 }
const attribution = { fontSize: 12, browserDefault: false }
const data = () => ({ text: [], active: [], attribution })
describe('diagnostics', () => {
  it('I-41 reports real overlaps and excludes allowed subtrees same owners and disjoint text', () => {
    expect(intersects(rect, { ...rect, left: 21, right: 40 })).toBe(false)
    const sample = { ...data(), text: [ { ...rect, label: 'A', owner: 'A', allowed: false }, { ...rect, label: 'B', owner: 'B', allowed: false } ] }
    expect(diagnose(sample, 3)).toEqual(['step 3: overlap A / B'])
    expect(diagnose({ ...sample, text: sample.text.map(item => ({ ...item, allowed: true })) }, 3)).toEqual([])
    expect(diagnose({ ...sample, text: sample.text.map(item => ({ ...item, owner: 'same' })) }, 3)).toEqual([])
  })
  it('I-42 warns for identical active progress and toc treatments and accepts distinct treatments', () => {
    expect(diagnose({ ...data(), active: ['progress', 'toc'].map(kind => ({ kind, current: 'same', other: 'same' })) }, 2))
      .toEqual(['step 2: indistinct active progress', 'step 2: indistinct active toc'])
    expect(diagnose({ ...data(), active: [{ kind: 'progress', current: 'selected', other: 'plain' }] }, 2)).toEqual([])
  })
  it('I-43 warns for absent tiny and browser-default attribution and accepts authored legibility', () => {
    for (const value of [null, { fontSize: 9, browserDefault: false }, { fontSize: 16, browserDefault: true }]) {
      expect(diagnose({ ...data(), attribution: value }, 4)).toEqual(['step 4: style [data-presentation-attribution] for legibility'])
    }
    expect(diagnose(data(), 4)).toEqual([])
  })
  it.each(['console', 'pageerror'])('I-38 fails on %s errors and ignores ordinary console messages', kind => {
    const page = new EventEmitter()
    const check = watchErrors(page)
    page.emit('console', { type: () => 'log', text: () => 'fine' })
    expect(check).not.toThrow()
    if (kind === 'console') page.emit('console', { type: () => 'error', text: () => 'injected console fault' })
    else page.emit('pageerror', new Error('injected page fault'))
    expect(check).toThrow('injected')
  })
})
