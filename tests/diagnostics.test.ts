import { describe, expect, it } from 'vitest'
import { EventEmitter } from 'node:events'
import { collectDiagnostics, diagnose, intersects } from '../scripts/diagnostics.mjs'
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

it('I-41 diagnoses icon-only chrome and padded control collisions while excluding own labels and allowed subtrees', () => {
  const control = { ...rect, owner: 'control', label: 'chrome control', ancestors: [] }
  const icon = { ...rect, owner: 'icon', label: 'chrome icon', ancestors: [] }
  expect(diagnose({ ...data(), chrome: [control, icon] }, 5)).toEqual(['step 5: overlap chrome control / chrome icon'])
  const label = { ...rect, owner: 'label', label: 'label', ancestors: ['control'] }
  expect(diagnose({ ...data(), text: [label], chrome: [control] }, 5)).toEqual([])
  const foreignText = { ...rect, owner: 'foreign', label: 'foreign text', ancestors: [] }
  expect(diagnose({ ...data(), text: [foreignText], chrome: [control] }, 5)).toEqual(['step 5: overlap foreign text / chrome control'])
  expect(diagnose({ ...data(), text: [foreignText], chrome: [{ ...control, allowed: true }] }, 5)).toEqual([])
  const container = { ...rect, owner: 'container', label: 'chrome container', ancestors: [] }
  expect(diagnose({ ...data(), chrome: [container, { ...control, ancestors: ['container'] }] }, 5)).toEqual([])
})
it('I-42 compares rendered borders and ignores zero-width absent and transparent border color differences', () => {
  const root = document.createElement('main')
  root.setAttribute('data-presentation', '')
  root.innerHTML = '<div data-presentation-progress><button data-presentation-progress-entry data-active="true"></button><button data-presentation-progress-entry data-active="false"></button></div>'
  document.body.append(root)
  root.querySelectorAll('*').forEach(element => { element.checkVisibility = () => true })
  const [current, other] = root.querySelectorAll('button')
  try {
    for (const treatment of ['0px solid', '2px none', '2px solid transparent']) {
      current.style.border = treatment
      other.style.border = treatment
      if (!treatment.includes('transparent')) {
        current.style.borderColor = 'red'
        other.style.borderColor = 'blue'
      } else {
        current.style.borderColor = 'rgba(255, 0, 0, 0)'
        other.style.borderColor = 'rgba(0, 0, 255, 0)'
      }
      expect(diagnose(collectDiagnostics(), 6).filter(warning => warning.includes('indistinct active')))
        .toEqual(['step 6: indistinct active progress'])
    }
    current.style.border = '2px solid red'
    other.style.border = '2px solid blue'
    expect(diagnose(collectDiagnostics(), 6).filter(warning => warning.includes('indistinct active'))).toEqual([])
  } finally { root.remove() }
})
