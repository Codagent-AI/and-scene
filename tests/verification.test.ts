import { expect, it } from 'vitest'
import { EventEmitter } from 'node:events'
import { validateOutline } from '../scripts/verify.mjs'
import { captureErrors, assertClean } from '../scripts/browser.mjs'
import expected from '../scripts/reference-outline.json'
it('I-38 missing malformed count field mismatch and reordered outline fail', () => {
 for(const bad of [undefined,{},[],expected.slice(1),[...expected].reverse(),expected.map((x,i)=>i===0?{...x,title:'wrong'}:x),expected.map((x,i)=>i===1?{...x,caption:'wrong'}:x)]) expect(()=>validateOutline(bad,expected)).toThrow(/sample/)
 expect(()=>validateOutline(expected,expected)).not.toThrow()
})
it('I-41 console and pageerror channels report offending step', () => {
 const page=new EventEmitter()
 const errors=captureErrors(page)
 page.emit('console',{type:()=> 'log',text:()=> 'ignored'})
 expect(()=>assertClean(errors,0)).not.toThrow()
 page.emit('console',{type:()=> 'error',text:()=> 'fault'})
 expect(()=>assertClean(errors,2)).toThrow('render step 2: console: fault')
 errors.length=0;page.emit('pageerror',new Error('crash'))
 expect(()=>assertClean(errors,3)).toThrow('render step 3: pageerror: crash')
})
