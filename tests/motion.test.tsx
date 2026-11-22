import { expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
const recorded = vi.hoisted(() => ({ props: [] as Record<string, unknown>[] }))
vi.mock('motion/react', () => ({
 motion: { div: (props: Record<string, unknown>) => { recorded.props.push(props); return <div>{props.children as React.ReactNode}</div> } },
 AnimatePresence: ({children}: {children:React.ReactNode}) => <>{children}</>,
 LayoutGroup: ({children}: {children:React.ReactNode}) => <>{children}</>,
}))
import { Box } from '../src/presentation-kit/nodes/Box'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { Stage } from '../src/presentation-kit/Stage'
import { ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
it('I-15 motion configuration keeps shared layout identity, delayed newcomers and departure exit', () => {
 render(<Box id="shared" style={{left:10,width:40}}>Label</Box>)
 expect(recorded.props.at(-1)).toMatchObject({layoutId:'shared',layout:true,transition:{layout:LAYOUT_T}})
 render(<Appear>new entity</Appear>)
 expect(recorded.props.at(-1)).toMatchObject({initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:ENTER_T})
 render(<Stage mode="browse" step={{id:'s',era:'era',title:'T',caption:'C',payload:undefined,Scene:()=>null}} />)
 expect(recorded.props.some(p => !!p.exit)).toBe(true)
})
