// @vitest-environment jsdom
import { createElement } from 'react'
import { expect, it, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
const received = vi.hoisted(() => [] as Record<string, unknown>[])
vi.mock('motion/react', () => ({ motion: { div: (props: Record<string, unknown>) => { received.push(props); return createElement('div', null, props.children as React.ReactNode) } } }))
import { Box, Appear } from '../src/presentation-kit/nodes'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
it('keeps layout identity, delays entry until layout settles, and defines exit',()=>{ render(<><Box id="stable">A</Box><Appear>B</Appear></>); const box=received.find(x=>x.layoutId==='stable')!; expect(box.initial).toEqual({opacity:0}); expect(box.animate).toEqual({opacity:1}); expect(box.exit).toEqual({opacity:0}); expect(box.transition).toEqual({layout:{duration:LAYOUT_T},opacity:{delay:ENTER_DELAY,duration:ENTER_T}}); expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T); cleanup() })
