import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const seen: Record<string, unknown>[] = []
const presenceChildren: ReactNode[] = []

vi.mock('motion/react', () => {
  const make = (tag: string) =>
    function Mock(props: Record<string, unknown>) {
      seen.push({ tag, ...props })
      const { children, layoutId, className, style, ...rest } = props
      const data = Object.fromEntries(Object.entries(rest).filter(([k]) => k.startsWith('data-')))
      const Tag = tag as 'div'
      return (
        <Tag className={className as string} style={style as never} data-layout-id={layoutId as string} {...data}>
          {children as ReactNode}
        </Tag>
      )
    }
  return {
    motion: { div: make('div'), svg: make('svg'), path: make('path'), polygon: make('polygon') },
    AnimatePresence: ({ children }: { children: ReactNode }) => {
      presenceChildren.push(children)
      return <>{children}</>
    },
    LayoutGroup: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

const kit = await import('../../src/presentation-kit')
const { Appear, Arrow, Box, SceneLayer, Stage, ENTER_DELAY, LAYOUT_T, ENTER_T, EXIT_T } = kit

describe('motion wiring', () => {
  it('gives every node a layout projection keyed by its stable id, plus an exit', () => {
    seen.length = 0
    render(<Box id="thing" label="x" />)
    const props = seen.find((p) => p.layoutId === 'thing')!
    expect(props.layout).toBe(true)
    expect(props.exit).toMatchObject({ opacity: 0 })
    expect(props.transition).toMatchObject({ layout: { duration: LAYOUT_T } })
    seen.length = 0
    render(<Arrow id="arr" from={[0, 0]} to={[10, 10]} />)
    expect(seen.find((p) => p.layoutId === 'arr')!.layout).toBe(true)
  })

  it('gives only the introducing step a newcomer fade; continuing entities carry none of it', () => {
    seen.length = 0
    render(<Box id="new" enter label="x" />)
    const fresh = seen.find((p) => p.layoutId === 'new')!
    expect(fresh.initial).toEqual({ opacity: 0 })
    const animate = fresh.animate as { opacity: number; transition: { delay: number } }
    expect(animate.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    seen.length = 0
    render(<Box id="old" label="x" />)
    const old = seen.find((p) => p.layoutId === 'old')!
    expect(old.initial).toBeUndefined()
    expect(old.animate).toEqual({ opacity: 1 })
    seen.length = 0
    render(<Arrow id="arr-old" from={[0, 0]} to={[1, 1]} />)
    expect(seen.find((p) => p.layoutId === 'arr-old')!.initial).toBeUndefined()
    render(<Arrow id="arr-new" from={[0, 0]} to={[1, 1]} enter />)
    expect(seen.find((p) => p.layoutId === 'arr-new')!.initial).toEqual({ opacity: 0 })
  })

  it('animates arrow endpoints and bend instead of snapping them', () => {
    seen.length = 0
    render(<Arrow id="geo" from={[0, 0]} to={[100, 0]} bend={10} bidirectional />)
    const path = seen.find((p) => p.tag === 'path')!
    // an explicit initial value keeps the attribute defined before the first animation frame
    expect(path.initial).toEqual({ d: expect.stringMatching(/^M/) })
    expect(path.animate).toEqual(path.initial)
    expect(path.transition).toMatchObject({ duration: LAYOUT_T })
    const heads = seen.filter((p) => p.tag === 'polygon')
    expect(heads).toHaveLength(2)
    for (const h of heads) {
      expect(h.initial).toEqual({ points: expect.any(String) })
      expect(h.animate).toEqual(h.initial)
    }
  })

  it('makes newcomers enter only after the layout morph has finished', () => {
    seen.length = 0
    render(<Appear><span /></Appear>)
    const props = seen.find((p) => 'animate' in p)!
    expect(props.initial).toEqual({ opacity: 0 })
    const animate = props.animate as { opacity: number; transition: { delay: number; duration: number } }
    expect(animate.opacity).toBe(1)
    expect(animate.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(animate.transition.delay).toBe(ENTER_DELAY)
    expect(animate.transition.duration).toBe(ENTER_T)
    expect(props.exit).toMatchObject({ opacity: 0, transition: { duration: EXIT_T } })
  })

  it('encloses scene layer children in AnimatePresence so removed ones can exit', () => {
    presenceChildren.length = 0
    const child = <Appear key="k"><span /></Appear>
    render(<SceneLayer>{child}</SceneLayer>)
    expect(presenceChildren).toContain(child)
  })

  it('cross-fades ungrouped scenes through AnimatePresence in the stage', () => {
    seen.length = 0
    presenceChildren.length = 0
    const Scene = () => <i />
    render(<Stage step={{ id: 's', era: 'e', title: 't', caption: 'c', Scene, payload: undefined }} mode="browse" />)
    const scene = seen.find((p) => 'data-presentation-scene' in p)!
    expect(scene.exit).toMatchObject({ opacity: 0 })
    expect(presenceChildren.length).toBeGreaterThan(0)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })
})
