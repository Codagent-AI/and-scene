import { describe, it, expect } from 'vitest'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
// JavaScript tooling is deliberately shared with the distributable scaffold.
import { diagnose } from '../../scripts/diagnostics.mjs'
import { validateReference, monitorErrors } from '../../scripts/browser.mjs'
import reference from '../../scripts/reference.json'
const expected=reference.steps
describe('sample validation failures',()=>{
 it('rejects missing registration metadata count duplicate malformed wrong era title caption and order',()=>{
  for(const bad of [undefined,[],expected.slice(1),[...expected,expected[0]],expected.map((s,i)=>i===1?{...s,id:expected[0].id}:s),expected.map((s,i)=>i===0?null:s),...["era","title","caption"].map(key=>expected.map((s,i)=>i===2?{...s,[key]:'wrong'}:s)),[expected[1],expected[0],...expected.slice(2)]]) expect(()=>validateReference(bad,expected)).toThrow(/sample:/)
  expect(()=>validateReference(expected,expected)).not.toThrow()
 })
})
describe('browser error monitor',()=>{
 for(const event of ['console','pageerror']) for(const step of [0,4]) it(`attributes ${event} during step ${step} including settling`,()=>{
  const page=new EventEmitter();const monitor=monitorErrors(page);monitor.setStep(step)
  if(event==='console') page.emit(event,{type:()=> 'error',text:()=> 'boom'});else page.emit(event,new Error('boom'))
  expect(()=>monitor.check()).toThrow(`step ${step}: boom`)
 })
 it('installs listeners before navigation and ignores ordinary logs',()=>{const page=new EventEmitter();const m=monitorErrors(page);expect(page.listenerCount('console')).toBe(1);expect(page.listenerCount('pageerror')).toBe(1);page.emit('console',{type:()=> 'log',text:()=> 'ok'});expect(()=>m.check()).not.toThrow()})
})
describe('diagnostics',()=>{
 const rect=(id:string,extra={})=>({id,left:0,top:0,right:20,bottom:20,visible:true,allowed:false,...extra})
 const goodAttribution={size:12,family:'Trebuchet MS',color:'rgb(60, 80, 60)',decoration:'none'}
 const state=(extra={})=>({text:[],chrome:[],attribution:goodAttribution,...extra})
 it('reports visible collisions but excludes hidden separate or explicitly allowed text and scopes exemptions',()=>{
  expect(diagnose(state({text:[rect('a'),rect('b')]}),3)).toEqual(['step 3: overlap a / b'])
  for(const change of [{visible:false},{allowed:true},{left:30,right:40}])expect(diagnose(state({text:[rect('a'),rect('b',change)]}),0)).toEqual([])
  expect(diagnose(state({text:[rect('allowed ancestor',{allowed:true}),rect('nested',{allowed:true}),rect('outside-a'),rect('outside-b')]}),1)).toEqual(['step 1: overlap outside-a / outside-b'])
 })
 for(const kind of ['progress','toc-entry']) it(`detects indistinct ${kind} and accepts distinct state`,()=>{
  expect(diagnose(state({chrome:[{kind,active:true,signature:'same'},{kind,active:false,signature:'same'}]}),2)).toEqual([`step 2: indistinct active ${kind} [data-presentation-${kind}]`])
  expect(diagnose(state({chrome:[{kind,active:true,signature:'active'},{kind,active:false,signature:'inactive'}]}),2)).toEqual([])
 })
 it('diagnoses missing undersized browser-default attribution and accepts legible local styling',()=>{
  for(const attribution of [null,{...goodAttribution,size:11.5},{size:16,family:'"Times New Roman"',color:'rgb(0, 0, 238)',decoration:'none'}])expect(diagnose(state({attribution}),5)).toEqual(['step 5: unpolished attribution: style [data-presentation-attribution]'])
  expect(diagnose(state(),0)).toEqual([])
 })
 it('includes padded and icon-only chrome bounds while excluding self ancestors invisible controls and scoped exemptions',()=>{
  const label=rect('scene',{owner:1,ancestors:[0]})
  const control=rect('control',{owner:2,ancestors:[0]})
  expect(diagnose(state({text:[label],controls:[control]}),4)).toEqual(['step 4: overlap scene / control'])
  expect(diagnose(state({controls:[control,rect('icon',{owner:3,ancestors:[0]})]}),4)).toEqual(['step 4: overlap control / icon'])
  for(const change of [{owner:1},{ancestors:[1,0]},{visible:false},{allowed:true}])expect(diagnose(state({text:[label],controls:[{...control,...change}]}),4)).toEqual([])
 })
 it('collects computed geometry via text ranges and scoped ancestor markers rather than parent duplicate text',()=>{
  // The production collector uses browser geometry; this contract covers its selection policy.
  const s=readFileSync('scripts/diagnostics.mjs','utf8');expect(s).toContain('createTreeWalker');expect(s).toContain("closest('[data-presentation-allow-overlap]')");expect(s).toContain('checkVisibility')
 })
})
