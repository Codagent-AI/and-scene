import { expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
const recorded = vi.hoisted(() => [] as Array<Record<string, unknown>>)
vi.mock('motion/react', () => ({ motion: { div: (props: Record<string, unknown>) => { recorded.push(props); return createElement('div', null, props.children as React.ReactNode) } } }))
import { Appear, Box } from '../src/presentation-kit/nodes'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
it('preserves entity identity and configures delayed entry and exit', () => {
 render(<><Box id="persistent" data-example="hook">Entity</Box><Appear>New</Appear></>)
 expect(recorded[0].layoutId).toBe('persistent'); expect(recorded[0].layout).toBe(true); expect(recorded[0]['data-example']).toBe('hook')
 expect(recorded[1].initial).toEqual({ opacity: 0 }); expect(recorded[1].animate).toEqual({ opacity: 1 }); expect(recorded[1].exit).toEqual({ opacity: 0 }); expect(recorded[1].transition).toEqual({ duration: ENTER_T, delay: ENTER_DELAY }); expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
})
