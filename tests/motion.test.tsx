import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { Stage } from '../src/presentation-kit/Stage'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
import type { Step } from '../src/presentation-kit/types'
const captures = vi.hoisted(() => ({ motions: [] as Record<string, unknown>[], presence: [] as Record<string, unknown>[], groups: [] as Record<string, unknown>[] }))
vi.mock('motion/react', async () => {
  const React = await import('react')
  return {
    motion: { div: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => { captures.motions.push(props); return <div>{children}</div> } },
    AnimatePresence: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => { captures.presence.push(props); return children },
    LayoutGroup: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => { captures.groups.push(props); return children },
  }
})

describe('I-14 stable entity motion contract', () => {
  it('keeps a stable layout identity while authored position size label and emphasis change', () => {
    captures.motions.length = 0
    const { rerender } = render(<Box id="continuing" style={{ left: 10, width: 100 }} data-emphasis="quiet">Before</Box>)
    rerender(<Box id="continuing" style={{ left: 200, width: 160 }} data-emphasis="strong">After</Box>)
    expect(captures.motions.map(props => props.layoutId)).toEqual(['continuing', 'continuing'])
    for (const props of captures.motions) {
      expect(props.layout).toBe(true)
      expect(props.transition).toEqual({ layout: { duration: LAYOUT_T, ease: EASE } })
      expect(props.initial).toBeUndefined()
      expect(props.animate).toBeUndefined()
    }
    expect(captures.motions[1].style).toEqual({ left: 200, width: 160 })
    expect(captures.motions[1]['data-emphasis']).toBe('strong')
  })
  it('delays newcomers until continuing motion settles and configures departures to fade out', () => {
    captures.motions.length = 0
    render(<Appear><Box id="new">New</Box></Appear>)
    const appear = captures.motions.find(props => 'data-presentation-appear' in props)!
    expect(appear.initial).toEqual({ opacity: 0 })
    expect(appear.animate).toEqual({ opacity: 1 })
    expect(appear.exit).toEqual({ opacity: 0 })
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(appear.transition).toEqual({ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE })
  })
  it('hosts ungrouped exits in AnimatePresence and shared morphs in a scoped LayoutGroup', () => {
    captures.motions.length = 0; captures.presence.length = 0; captures.groups.length = 0
    function Scene() { return <Box id="entity">Body</Box> }
    const step: Step = { id: 'one', era: 'ask', title: 'One', caption: 'Caption.', Scene, payload: undefined }
    render(<Stage step={step} mode="browse" />)
    expect(captures.presence[0]).toEqual({ initial: false, mode: 'sync' })
    expect(captures.groups[0].id).toBeTruthy()
    const host = captures.motions.find(props => 'data-presentation-scene' in props)!
    expect(host.exit).toEqual({ opacity: 0 })
    expect(host.animate).toEqual({ opacity: 1 })
  })
})
