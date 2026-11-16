import { describe, expect, it } from 'vitest'
// @ts-expect-error Node scripts are deliberately portable JavaScript.
import { OUTLINE, validateOutline, isRegistered } from '../scripts/reference.mjs'
// @ts-expect-error Node scripts are deliberately portable JavaScript.
import { diagnose } from '../scripts/diagnostics.mjs'
// @ts-expect-error Node scripts are deliberately portable JavaScript.
import { collectBrowserErrors } from '../scripts/verify.mjs'
import { EventEmitter } from 'node:events'

const outline = () => OUTLINE.map(([era, title, caption]: string[]) => ({ era, title, caption }))
describe('reference validation', () => {
  it('requires a registered slug field rather than a substring in an import path', () => {
    expect(isRegistered("{slug: 'other', load: () => import('./wanted/Talk')}", 'wanted')).toBe(false)
    expect(isRegistered("{slug: 'wanted', load: () => import('./wanted/Talk')}", 'wanted')).toBe(true)
  })
  it('accepts exactly the normative ordered nine-step metadata', () => expect(() => validateOutline(outline())).not.toThrow())
  it('rejects missing and out-of-order sample metadata', () => {
    expect(() => validateOutline([])).toThrow('nine steps')
    const rows = outline(); [rows[0], rows[1]] = [rows[1], rows[0]]
    expect(() => validateOutline(rows)).toThrow('step 0')
  })
  it('rejects changed era title or caption at the offending index', () => {
    for (const field of ['era', 'title', 'caption']) {
      const rows = outline(); rows[3][field] = 'changed'
      expect(() => validateOutline(rows)).toThrow('step 3')
    }
  })
})
describe('browser error collection', () => {
  it('attributes console and uncaught page errors to the active step and removes listeners', () => {
    const page = new EventEmitter(); let step = 2
    const errors = collectBrowserErrors(page, () => step)
    page.emit('console', { type: () => 'log', text: () => 'harmless' }); expect(() => errors.assertClean()).not.toThrow()
    page.emit('console', { type: () => 'error', text: () => 'bad console' }); step = 4
    page.emit('pageerror', new Error('bad render'))
    expect(() => errors.assertClean()).toThrow('step 2: console error: bad console')
    expect(() => errors.assertClean()).toThrow('step 4: page error: bad render')
    errors.dispose(); expect(page.listenerCount('console') + page.listenerCount('pageerror')).toBe(0)
  })
})
const attribution = { kind: 'attribution', name: 'link', visible: true, fontSize: 12, browserDefault: false }
const text = (name: string, props = {}) => ({ kind: 'text', name, visible: true, left: 0, right: 30, top: 0, bottom: 20, ...props })
describe('inspection diagnostics', () => {
  it('reports intersecting visible text and chrome but exempts marked and hidden descendants', () => {
    expect(diagnose([attribution, text('scene'), text('caption')])).toEqual(['overlap: scene / caption'])
    expect(diagnose([attribution, text('scene'), text('caption', { allowOverlap: true }), text('hidden', { visible: false })])).toEqual([])
    expect(diagnose([attribution, text('scene'), text('adjacent', { left: 31 })])).toEqual([])
  })
  it('reports text over icon-only controls and progress dots, and overlapping chrome bodies', () => {
    const chrome = (name: string, props = {}) => ({ ...text(name), kind: 'chrome', ...props })
    for (const control of ['icon-only next', 'empty progress dot']) {
      expect(diagnose([attribution, text('diagram label'), chrome(control)])).toEqual([`overlap: diagram label / ${control}`])
    }
    expect(diagnose([attribution, chrome('previous control'), chrome('next control')])).toEqual(['overlap: previous control / next control'])
    expect(diagnose([attribution, text('diagram label'), chrome('allowed control', { allowOverlap: true }), chrome('hidden control', { visible: false })])).toEqual([])
  })
  it('exempts controls from their own labels and nested chrome but detects unrelated scene text', () => {
    const button = { ...text('next button'), kind: 'chrome', id: 2, ancestors: [1] }
    const label = text('button label', { id: 3, ancestors: [2, 1] })
    const navigation = { ...text('navigation'), kind: 'chrome', id: 1, ancestors: [] }
    expect(diagnose([attribution, navigation, button, label])).toEqual([])
    expect(diagnose([attribution, button, text('unrelated diagram', { id: 4, ancestors: [] })])).toEqual(['overlap: next button / unrelated diagram'])
    expect(diagnose([attribution, button, text('direct button label', { id: 2, ancestors: [1] })])).toEqual([])
  })
  it('reports indistinct active progress and toc while accepting distinct treatments', () => {
    for (const kind of ['progress', 'toc']) {
      const controls = [{ kind, name: 'current', visible: true, active: true, appearance: 'same' }, { kind, name: 'other', visible: true, active: false, appearance: 'same' }]
      expect(diagnose([attribution, ...controls])).toEqual([`indistinct active ${kind}: current`])
      controls[1].appearance = 'different'; expect(diagnose([attribution, ...controls])).toEqual([])
    }
  })
  it('reports missing undersized and browser-default attribution with its styling hook', () => {
    expect(diagnose([]).join()).toContain('missing attribution: style [data-presentation-attribution]')
    expect(diagnose([{ ...attribution, fontSize: 9 }]).join()).toContain('unpolished attribution')
    expect(diagnose([{ ...attribution, browserDefault: true }]).join()).toContain('[data-presentation-attribution]')
    expect(diagnose([attribution])).toEqual([])
  })
})
