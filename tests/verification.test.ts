import { describe, expect, it } from 'vitest'
// @ts-expect-error Node scripts are deliberately portable JavaScript.
import { OUTLINE, validateOutline } from '../scripts/reference.mjs'
// @ts-expect-error Node scripts are deliberately portable JavaScript.
import { diagnose } from '../scripts/diagnostics.mjs'
// @ts-expect-error Node scripts are deliberately portable JavaScript.
import { collectBrowserErrors } from '../scripts/verify.mjs'
import { EventEmitter } from 'node:events'

const outline = () => OUTLINE.map(([era, title, caption]: string[]) => ({ era, title, caption }))
describe('reference validation', () => {
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
