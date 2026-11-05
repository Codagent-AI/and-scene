import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
const recorded = vi.hoisted(() => [] as Array<Record<string, unknown>>)
vi.mock('motion/react', () => ({ motion: { div: (props: Record<string, unknown>) => { recorded.push(props); return React.createElement('div', null, props.children as React.ReactNode) } } }))
import { Appear, Box, SceneLayer } from '../src/presentation-kit/nodes'
import { ENTER_DELAY, LAYOUT_T } from '../src/presentation-kit/constants'
afterEach(() => { cleanup(); recorded.length = 0 })
it('preserves layout identity and configures entry after layout and exit', () => {
 const {rerender}=render(<SceneLayer><Box id="persist" style={{left:10}}>old</Box><Appear>new</Appear></SceneLayer>)
 const first=recorded.find(x=>x.layoutId==='persist')!; expect(first.transition).toEqual({layout:{duration:LAYOUT_T}})
 const appear=recorded.find(x=>x.initial)!; expect(appear.initial).toEqual({opacity:0}); expect(appear.animate).toEqual({opacity:1}); expect(appear.exit).toEqual({opacity:0}); expect((appear.transition as {delay:number}).delay).toBeGreaterThanOrEqual(LAYOUT_T); expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
 recorded.length=0; rerender(<SceneLayer><Box id="persist" style={{left:100}}>updated</Box></SceneLayer>); expect(recorded.find(x=>x.layoutId==='persist')?.children).toContain('updated')
})
