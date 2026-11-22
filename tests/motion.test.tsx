import { expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
const { seen } = vi.hoisted(() => ({ seen: [] as Record<string, unknown>[] }))
vi.mock('motion/react', () => ({
 motion: { div: (props: Record<string, unknown>) => { seen.push(props); return <div>{props.children as ReactNode}</div> } },
}))
import { Box } from '../src/presentation-kit/nodes/Box'
import { entrance } from '../src/presentation-kit/nodes/Node'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
it('I-17 instrumented motion boundary receives stable projection identity, state changes and ordered entry/exit', () => {
 const { rerender } = render(<Box id="same" {...entrance} style={{left:10,width:100}} data-emphasis="quiet">Old</Box>)
 const first=seen.at(-1)!
 rerender(<Box id="same" {...entrance} style={{left:80,width:200}} data-emphasis="strong">New</Box>)
 const next=seen.at(-1)!
 expect(first.layoutId).toBe(next.layoutId);expect(next.layout).toBe(true)
 expect(first.style).toEqual({left:10,width:100});expect(next.style).toEqual({left:80,width:200})
 expect(next.children).toEqual(expect.anything());expect(next['data-emphasis']).toBe('strong')
 expect(next.transition).toEqual({ layout:{duration:LAYOUT_T,ease:EASE},opacity:{duration:ENTER_T} })
 expect(next.animate).toEqual({opacity:1,transition:{delay:ENTER_DELAY,duration:ENTER_T}})
 expect(next.exit).toEqual({opacity:0,transition:{delay:0,duration:ENTER_T}})
 expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
})
