import { EventEmitter } from 'node:events'
import { captureErrors } from '../scripts/browser.mjs'
import { expect, it } from 'vitest'
import { REFERENCE, validateReference } from '../scripts/reference.mjs'
import { diagnostics, overlaps } from '../scripts/diagnostics.mjs'
it('I-41 reference validation rejects missing, incorrect title, count and order', () => {
 expect(()=>validateReference(REFERENCE)).not.toThrow()
 for(const value of [null,{}, {...REFERENCE,title:'wrong'}, {...REFERENCE,steps:REFERENCE.steps.slice(1)}, {...REFERENCE,steps:[...REFERENCE.steps].reverse()}]) expect(()=>validateReference(value)).toThrow(/reference/)
})
const rect={x:0,y:0,width:100,height:30}
const style={color:'rgb(20, 40, 30)',backgroundColor:'transparent',fontWeight:'600',fontSize:'12px',textDecorationLine:'none'}
it('I-47 overlap warnings identify step and elements and exempt explicit subtrees', () => {
 expect(overlaps(rect,{...rect,x:100})).toBe(false)
 const state={texts:[{label:'caption',rect},{label:'node',rect}],chrome:[],attribution:{style}}
 expect(diagnostics(state,2)).toContain('step 2: overlap: caption ↔ node')
 expect(diagnostics({...state,texts:[{label:'caption',rect,allowed:true},{label:'node',rect}]},2)).toEqual([])
})
it('I-48 active chrome diagnostics distinguish progress and table of contents', () => {
 for(const name of ['progress','toc']) {
  const state={texts:[],chrome:[{name,active:style,inactive:style}],attribution:{style}}
  expect(diagnostics(state,3)).toContain(`step 3: indistinct active ${name}; style [data-active="true"]`)
  expect(diagnostics({...state,chrome:[{name,active:{...style,fontWeight:'700'},inactive:style}]},3)).toEqual([])
 }
})
it('I-49 attribution diagnostics cover missing, undersized and browser-default links', () => {
 for(const attribution of [null,{style:{...style,fontSize:'9px'}},{style:{...style,color:'rgb(0, 0, 238)',textDecorationLine:'underline'}}]) expect(diagnostics({texts:[],chrome:[],attribution},0).join(' ')).toMatch(/step 0:.*data-presentation-attribution/)
 expect(diagnostics({texts:[],chrome:[],attribution:{style}},0)).toEqual([])
})

it('I-44 browser error capture rejects console errors and page errors while ignoring warnings', () => {
 const page=new EventEmitter()
 const assertClean=captureErrors(page)
 page.emit('console',{type:()=> 'warning',text:()=> 'advisory'});expect(assertClean).not.toThrow()
 page.emit('console',{type:()=> 'error',text:()=> 'console failure'});expect(assertClean).toThrow('console: console failure')
 const other=new EventEmitter(),check=captureErrors(other)
 other.emit('pageerror',new Error('page failure'));expect(check).toThrow('pageerror: page failure')
})

it('I-47 chrome surfaces collide with text and controls while their own labels are exempt',()=>{
 const state={texts:[{label:'own label',rect,owner:1}],surfaces:[{label:'icon only',rect,owner:1}],chrome:[],attribution:{style}}
 expect(diagnostics(state,4)).toEqual([])
 expect(diagnostics({...state,texts:[...state.texts,{label:'second label',rect,owner:1}]},4)).toContain('step 4: overlap: own label ↔ second label')
 expect(diagnostics({...state,texts:[{label:'scene text',rect}]},4)).toContain('step 4: overlap: scene text ↔ icon only')
 expect(diagnostics({...state,texts:[],surfaces:[...state.surfaces,{label:'other control',rect,owner:2}]},4)).toContain('step 4: overlap: icon only ↔ other control')
 expect(diagnostics({...state,texts:[{label:'allowed',rect,allowed:true}]},4)).toEqual([])
})
