import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { AnimatePresence } from 'motion/react'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { Stage } from '../src/presentation-kit/Stage'
import type { SceneProps, Step } from '../src/presentation-kit/types'

afterEach(()=>{cleanup();vi.restoreAllMocks()})
const pause=(ms:number)=>act(()=>new Promise(resolve=>setTimeout(resolve,ms)))
it('I-4 I-5 I-7 continuing boxes project changed layout while overlapping layers persist, newcomers delay and departures exit',async()=>{
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){
  const width=parseFloat(this.style.width)||880,height=parseFloat(this.style.height)||380
  const x=parseFloat(this.style.left)||0,y=parseFloat(this.style.top)||0
  return {x,y,width,height,left:x,top:y,right:x+width,bottom:y+height,toJSON(){return {}}}
 })
 let completedAt=Infinity
 const started=vi.fn(),completed=vi.fn(()=>{completedAt=performance.now()})
 function Diagram({payload}:SceneProps<number>) {
  return <SceneLayer><Box id="moving" style={{left:payload?160:20,top:payload?80:20,width:payload?180:100,height:80,fontWeight:payload?700:400}} onLayoutAnimationStart={started} onLayoutAnimationComplete={completed}>{payload?'emphasized new label':'old label'}</Box>
   <Box id="stack" style={{left:170,top:90,width:100,height:80,zIndex:2}}>intentional overlap</Box>
   <AnimatePresence>{payload===0?<Appear key="departing" data-testid="departing"><Box id="departing">departing</Box></Appear>:<Appear key="newcomer" data-testid="newcomer"><Box id="newcomer">newcomer</Box></Appear>}</AnimatePresence>
  </SceneLayer>
 }
 const step=(payload:number):Step<number>=>({id:String(payload),era:'test',title:'Test',caption:'Test.',Scene:Diagram,groupKey:'shared',payload})
 const view=render(<Stage step={step(0)}/>);await pause(1000)
 const moving=document.querySelector('[data-presentation-entity="moving"]') as HTMLElement
 const stack=document.querySelector('[data-presentation-entity="stack"]') as HTMLElement
 view.rerender(<Stage step={step(1)}/>);
 expect(document.querySelector('[data-presentation-entity="moving"]')).toBe(moving)
 expect(moving.textContent).toBe('emphasized new label')
 expect(stack.style.cssText).toContain('z-index: 2');expect(stack.style.left).toBe('170px')
 expect(view.getByTestId('newcomer').style.opacity).toBe('0')
 const departing=view.getByTestId('departing'),newcomer=view.getByTestId('newcomer')
 const departingOpacities:number[]=[];let enteredAt=Infinity
 const observer=new MutationObserver(()=>{
  const opacity=Number(newcomer.style.opacity);if(opacity>0&&enteredAt===Infinity)enteredAt=performance.now()
  departingOpacities.push(Number(departing.style.opacity))
 })
 observer.observe(newcomer,{attributes:true,attributeFilter:['style']});observer.observe(departing,{attributes:true,attributeFilter:['style']})
 await pause(120)
 expect(started).toHaveBeenCalled()
 expect(moving.style.transform).not.toBe('none');expect(moving.style.transform).not.toBe('')
 expect(view.getByTestId('newcomer').style.opacity).toBe('0')
 await waitFor(()=>expect(completed).toHaveBeenCalled(),{timeout:2000})
 await waitFor(()=>expect(view.getByTestId('newcomer').style.opacity).toBe('1'),{timeout:2000})
 await waitFor(()=>expect(view.queryByTestId('departing')).toBeNull(),{timeout:2000})
 observer.disconnect()
 expect(departingOpacities.some(opacity=>opacity>0&&opacity<1)).toBe(true)
 expect(enteredAt).toBeGreaterThanOrEqual(completedAt-20)
 expect(moving.style.fontWeight).toBe('700')
 expect(moving.style.left).toBe('160px');expect(moving.style.width).toBe('180px')
 expect(stack).toBe(document.querySelector('[data-presentation-entity="stack"]'))
 expect(parseFloat(moving.style.left)).toBeLessThan(parseFloat(stack.style.left)+100)
 expect(parseFloat(moving.style.left)+180).toBeGreaterThan(parseFloat(stack.style.left))
 expect(stack.style.top).toBe('90px');expect(stack.style.zIndex).toBe('2')
})
