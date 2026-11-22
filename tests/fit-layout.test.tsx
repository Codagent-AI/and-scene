import { act, render, fireEvent } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Presentation } from '../src/presentation-kit/Presentation'
import type { Step } from '../src/presentation-kit/types'
const steps: Step<null>[] = ['short', 'longer title'].map((title, i) => ({id:String(i), era:'era',title,caption:i ? 'A longer caption reserves its full reading height.' : 'Short caption.',payload:null,Scene:()=>null}))
afterEach(()=>vi.unstubAllGlobals())
it('I-17 measured stage slot overrides viewport estimates, remains stable across steps and disconnects',()=>{
 let notify: ResizeObserverCallback = ()=>{}
 const disconnect = vi.fn(), observe = vi.fn()
 vi.stubGlobal('ResizeObserver', class {constructor(callback:ResizeObserverCallback){notify=callback} observe=observe;disconnect=disconnect})
 const {container,unmount} = render(<Presentation title="Measured" steps={steps}/>)
 expect(observe).toHaveBeenCalledWith(container.querySelector('[data-presentation-stage-container]'))
 const resize = (width:number,height:number)=>act(()=>notify([{contentRect:{width,height}} as ResizeObserverEntry],{} as ResizeObserver))
 resize(1200,152)
 const canvas=container.querySelector<HTMLElement>('[data-presentation-canvas]')!
 expect(canvas.style.transform).toBe('scale(0.4)')
 fireEvent.keyDown(window,{key:'ArrowRight'})
 expect(canvas.style.transform).toBe('scale(0.4)')
 expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('longer title')
 const captions=container.querySelectorAll('[data-presentation-caption]')
 expect(captions).toHaveLength(2)
 expect(captions[0]).not.toHaveAttribute('aria-hidden')
 expect(captions[1]).toHaveAttribute('aria-hidden','true')
 resize(440,1000);expect(canvas.style.transform).toBe('scale(0.5)')
 resize(0,0);expect(canvas.style.transform).toBe('scale(0)')
 unmount();expect(disconnect).toHaveBeenCalledTimes(1)
})
