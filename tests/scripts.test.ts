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
