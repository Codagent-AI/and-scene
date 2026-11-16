import { describe, expect, it, vi } from 'vitest'
import { captureSettled, diagnose } from '../scripts/lib/diagnostics.mjs'
const element = (id: string, extra = {}) => ({ id, ancestors: [], visible: true, allowed: false, text: true, chrome: false, left: 0, right: 20, top: 0, bottom: 20, kind: '', active: false, signature: 'normal', ...extra })
const attribution = { visible: true, size: 12, browserDefault: false }
describe('I-37 capture sequencing', () => {
  it('waits the configured interval before capturing', async () => {
    vi.useFakeTimers()
    const screenshot = vi.fn()
    const page = { waitForTimeout: (ms: number) => new Promise(r=>setTimeout(r,ms)), screenshot }
    const promise = captureSettled(page, 'step.png',800)
    await vi.advanceTimersByTimeAsync(799); expect(screenshot).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1); await promise
    expect(screenshot).toHaveBeenCalledWith({path:'step.png',fullPage:true})
    vi.useRealTimers()
  })
})
describe('I-38 overlap filtering', () => {
  it('reports unmarked visible collisions with step and element identities', () => {
    expect(diagnose([element('caption'),element('label')],attribution,4)).toEqual(['step 4: overlap caption ↔ label'])
  })
  it('exempts allowed subtrees invisible elements ancestors and non-overlapping elements', () => {
    for (const extra of [{allowed:true},{visible:false},{ancestors:['a']},{left:30,right:50},{top:30,bottom:50},{text:false}]) {
      expect(diagnose([element('a'),element('b',extra)],attribution,0)).toEqual([])
    }
  })
})
describe('I-39 polish diagnostics', () => {
  it.each(['progress','toc'])('warns only when active %s is indistinct', kind => {
    const nodes=[element('active',{kind,active:true}),element('inactive',{kind,left:40,right:60})]
    expect(diagnose(nodes,attribution,2)).toContain(`step 2: indistinct active ${kind} chrome`)
    nodes[0].signature='active-style'; expect(diagnose(nodes,attribution,2)).toEqual([])
  })
  it.each([null,{visible:false,size:12,browserDefault:false},{visible:true,size:8,browserDefault:false},{visible:true,size:16,browserDefault:true}])('warns for missing hidden small or browser-default attribution: %j', value => {
    expect(diagnose([],value,3)).toEqual(['step 3: unpolished attribution; style [data-presentation-attribution]'])
  })
  it('accepts deliberate legible attribution', () => { expect(diagnose([],attribution,0)).toEqual([]) })
})
