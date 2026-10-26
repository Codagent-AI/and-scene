import { describe, expect, it } from 'vitest'
import { EventEmitter } from 'node:events'
import { diagnose, findOverlaps } from '../scripts/diagnostics.mjs'
import { validateOutline } from '../scripts/verify.mjs'
import { watchErrors } from '../scripts/browser-runtime.mjs'
import outline from '../scripts/reference-outline.json'
it('I-31 validator rejects missing reordered and malformed sample metadata', () => {
  expect(() => validateOutline(outline,outline)).not.toThrow()
  expect(() => validateOutline([],outline)).toThrow('expected 9')
  expect(() => validateOutline([...outline].reverse(),outline)).toThrow('sample step 0')
  for (const field of ['era','title','caption']) expect(() => validateOutline([{ ...outline[0], [field]: 'wrong' }, ...outline.slice(1)],outline)).toThrow(field)
})
it.each(['console','pageerror'])('I-43 browser %s failure is surfaced by error watcher', channel => {
  const page = new EventEmitter(); const check = watchErrors(page)
  page.emit('console',{ type:()=> 'log', text:()=> 'okay' }); expect(check).not.toThrow()
  if (channel === 'console') page.emit('console',{ type:()=> 'error', text:()=> 'broken console' })
  else page.emit('pageerror',new Error('broken page'))
  expect(check).toThrow('broken')
})
describe('diagnostics', () => {
  const text = (owner: number, allowed = false, left = 0) => ({ owner, allowed, label: `text ${owner}`, left, right: left + 20, top: 0, bottom: 20 })
  it('I-45 overlapping text warns but same owner exempt subtree and separated text do not', () => {
    expect(findOverlaps([text(0),text(1)])).toEqual(['overlap: text 0 / text 1'])
    expect(findOverlaps([text(0),text(0)])).toEqual([])
    expect(findOverlaps([text(0,true),text(1)])).toEqual([])
    expect(findOverlaps([text(0),text(1,false,25)])).toEqual([])
  })
  it('I-45 text overlaps icon-only and padded chrome and chrome overlaps chrome', () => {
    const sceneText = text(0)
    const iconChrome = { ...text(1), label: 'mode-toggle (Icon mode)' }
    const paddedChrome = { ...text(2), label: 'next (Padded next)', right: 100 }
    const diagnostics = (texts: object[], chrome: object[]) => diagnose({ texts, chrome, controls: [], attribution: { size: 12, browserDefault: false } })
    expect(diagnostics([sceneText], [iconChrome])).toEqual(['overlap: text 0 / mode-toggle (Icon mode)'])
    expect(diagnostics([text(0, false, 50)], [paddedChrome])).toEqual(['overlap: text 0 / next (Padded next)'])
    expect(diagnostics([], [iconChrome, paddedChrome])).toEqual(['overlap: mode-toggle (Icon mode) / next (Padded next)'])
    expect(diagnostics([sceneText], [{ ...iconChrome, allowed: true }])).toEqual([])
  })
  it('I-45 own chrome text and nested chrome are not collisions', () => {
    const chrome = { ...text(1), label: 'brand' }
    const nested = { ...text(2), label: 'title', ancestors: [1] }
    const ownText = { ...text(3), ancestors: [2, 1] }
    expect(findOverlaps([chrome, nested, ownText])).toEqual([])
    expect(findOverlaps([ownText, nested, chrome])).toEqual([])
    expect(findOverlaps([chrome, { ...text(4), allowed: true }])).toEqual([])
  })
  it.each(['progress-step', 'toc-entry'])('I-46 later indistinct inactive %s peer warns once even when the first peer differs', kind => {
    const controls = [
      { kind, label: 'distinct', active: false, visual: ['red'] },
      { kind, label: 'matching', active: false, visual: ['black'] },
      { kind, label: 'active', active: true, visual: ['black'] },
    ]
    const diagnostics = () => diagnose({ texts: [], controls, attribution: { size: 12, browserDefault: false } })
    expect(diagnostics()).toEqual([`indistinct active navigation: ${kind} active`])
    controls[0].visual = ['black']
    expect(diagnostics()).toEqual([`indistinct active navigation: ${kind} active`])
    controls[0].visual = ['green']; controls[1].visual = ['green']
    expect(diagnostics()).toEqual([])
    controls[1].kind = 'unrelated'; controls[1].visual = ['black']
    expect(diagnostics()).toEqual([])
  })
  it('I-46 indistinct active chrome and missing small or default attribution warn', () => {
    for (const kind of ['progress-step','toc-entry']) {
      const controls = [{ kind, label:'a',active:true,visual:['black'] },{kind,label:'b',active:false,visual:['black']}]
      expect(diagnose({texts:[],controls,attribution:{size:12,browserDefault:false}})).toContain(`indistinct active navigation: ${kind} a`)
      controls[0].visual=['green']; expect(diagnose({texts:[],controls,attribution:{size:12,browserDefault:false}})).toEqual([])
    }
    for (const attribution of [null,{size:8,browserDefault:false},{size:16,browserDefault:true}]) expect(diagnose({texts:[],controls:[],attribution})[0]).toContain('attribution')
    expect(diagnose({texts:[],controls:[],attribution:{size:12,browserDefault:false}})).toEqual([])
  })
})
