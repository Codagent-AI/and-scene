import { it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
const { boundary } = vi.hoisted(() => ({boundary: [] as Record<string, unknown>[]}))
vi.mock('motion/react',async()=>{
 const React=await import('react')
 return {motion:{div:React.forwardRef<HTMLDivElement,Record<string,unknown>>(function InstrumentedMotion({children,...props},ref){boundary.push(props);return React.createElement('div',{ref},children as ReactNode)})},AnimatePresence:({children}:{children:ReactNode})=>children}
})
import { Box } from '../src/presentation-kit/nodes/Box'
import { Appear } from '../src/presentation-kit/nodes/Appear'
it('I-3 actual motion boundary receives persistent layout identity enter sequencing and exit animation',()=>{
 boundary.length=0
 const {rerender}=render(<Box id="same" style={{position:'absolute',left:10}}>Old label</Box>)
 const first=boundary.at(-1)!
 rerender(<Box id="same" style={{position:'absolute',left:200}}>New label</Box>)
 const second=boundary.at(-1)!
 expect(first.layoutId).toBe('same');expect(second.layoutId).toBe(first.layoutId)
 expect(second.layout).toBe(true);expect(second.style).toEqual({position:'absolute',left:200});expect(second.exit).toMatchObject({opacity:0})
 const moving=second.transition as {layout:{duration:number}}
 expect(moving.layout.duration).toBeGreaterThan(0)
 expect(second.initial).toBeUndefined()
 rerender(<Appear><Box id="new">Newcomer</Box></Appear>)
 const enter=boundary.find(p=>p['data-presentation-appear']==='')!
 expect(enter.initial).toEqual({opacity:0});expect(enter.animate).toEqual({opacity:1});expect(enter.exit).toEqual({opacity:0})
 const timing=enter.transition as {delay:number;duration:number}
 expect(timing.delay).toBeGreaterThanOrEqual(moving.layout.duration);expect(timing.duration).toBeGreaterThan(0)
})
