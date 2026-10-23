// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { Check } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import {
  Appear, Arrow, Box, ENTER_ANIMATE, ENTER_DELAY, EXIT_ANIMATE, Emphasis, Frame, LAYOUT_T, Label,
  SceneLayer, Stage, SymbolChip,
} from '../../src/presentation-kit'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/steps/scene'
import { makeSteps } from './helpers/fixtures'
import { parse } from './helpers/motion-mock'

vi.mock('motion/react', async () => (await import('./helpers/motion-mock')).motionMock)

const byEntity = (id: string) => document.querySelector(`[data-presentation-entity="${id}"]`)

/** An entrance may begin once the layout transition (delay + duration) has finished. */
const startsAfterLayout = (t: { delay?: number }) => (t.delay ?? 0) >= LAYOUT_T.delay + LAYOUT_T.duration

describe('persisting entities', () => {
  it.each([
    ['Box', Box],
    ['Label', Label],
    ['Frame', Frame],
    ['Emphasis', Emphasis],
    ['SymbolChip', SymbolChip],
  ])('%s forwards its id as the layoutId and morphs state in place', (_, Component) => {
    const { rerender } = render(<Component id="e1" x={10} y={20} width={30} height={40} data-state="old">old</Component>)
    const node = byEntity('e1')!
    expect(node.getAttribute('data-mock-layout-id')).toBe('e1')
    expect(node.getAttribute('style')).toContain('left: 10px')
    rerender(<Component id="e1" x={100} y={200} width={300} height={400} data-state="new">new</Component>)
    expect(byEntity('e1')).toBe(node) // same element, new geometry, label and state
    expect(node.getAttribute('style')).toContain('left: 100px')
    expect(node.getAttribute('style')).toContain('width: 300px')
    expect(node.textContent).toBe('new')
    expect(node.getAttribute('data-state')).toBe('new')
  })

  it('does not fade continuing entities: primitives carry no initial animation', () => {
    render(<Box id="plain" />)
    expect(byEntity('plain')?.getAttribute('data-mock-initial')).toBeNull()
  })

  it('arrow paths morph through animated path data on the same entity', () => {
    const { rerender } = render(<Arrow id="a" from={[0, 0]} to={[10, 0]} />)
    const first = byEntity('a')!.querySelector('path[data-mock-animate]')
    expect(parse(first, 'data-mock-animate').d).toBe('M 0 0 Q 5 0 10 0')
    rerender(<Arrow id="a" from={[0, 0]} to={[10, 50]} />)
    expect(parse(byEntity('a')!.querySelector('path[data-mock-animate]'), 'data-mock-animate').d).toContain('10 50')
  })
})

describe('arrows across ungrouped scene changes', () => {
  it('start a remounted arrow from where the previous instance of the same id was drawn', () => {
    const scene = (to: [number, number]) =>
      function ArrowScene() {
        return <SceneLayer><Arrow key="a" id="shared" from={[0, 0]} to={to} /></SceneLayer>
      }
    const steps = [
      { ...makeSteps(['a'])[0], id: 'one', Scene: scene([100, 0]) },
      { ...makeSteps(['a'])[0], id: 'two', Scene: scene([0, 100]) },
    ]
    const { rerender } = render(<Stage step={steps[0]} mode="browse" />)
    const first = document.querySelector('[data-presentation-entity="shared"] path[data-mock-animate]')!
    expect(parse(first, 'data-mock-initial').d).toBe(parse(first, 'data-mock-animate').d) // newcomer: no history
    const drawnBefore = parse(first, 'data-mock-animate').d
    rerender(<Stage step={steps[1]} mode="browse" />)
    const second = document.querySelector('[data-presentation-entity="shared"] path[data-mock-animate]')!
    expect(parse(second, 'data-mock-initial').d).toBe(drawnBefore)
    expect(parse(second, 'data-mock-animate').d).not.toBe(drawnBefore)
  })

  it('forgets an arrow once it is gone, so a later newcomer does not morph from stale geometry', () => {
    const { unmount } = render(<SceneLayer><Arrow key="g" id="ghost" from={[0, 0]} to={[5, 5]} /></SceneLayer>)
    unmount()
    render(<SceneLayer><Arrow key="g" id="ghost" from={[9, 9]} to={[50, 50]} /></SceneLayer>)
    const path = document.querySelector('[data-presentation-entity="ghost"] path[data-mock-animate]')!
    expect(parse(path, 'data-mock-initial').d).toBe(parse(path, 'data-mock-animate').d)
  })
})

describe('entering entities', () => {
  it('persisting entities use the layout transition that newcomers are ordered against', () => {
    render(
      <>
        <Box id="persist" />
        <Box id="newcomer" appear />
      </>,
    )
    const layout = parse(byEntity('persist'), 'data-mock-transition')
    expect(layout).toEqual(LAYOUT_T)
    const enter = parse(byEntity('newcomer'), 'data-mock-animate').transition
    expect(enter.delay).toBeGreaterThanOrEqual(layout.delay + layout.duration)
    expect(parse(byEntity('newcomer'), 'data-mock-initial')).toEqual({ opacity: 0 })
  })

  it('the appear prop applies only when set, with no wrapper element', () => {
    render(
      <>
        <Box id="plain" />
        <Label id="lbl" appear />
        <Frame id="frm" appear={false} />
      </>,
    )
    expect(byEntity('plain')?.getAttribute('data-mock-initial')).toBeNull()
    expect(parse(byEntity('lbl'), 'data-mock-initial')).toEqual({ opacity: 0 })
    expect(byEntity('frm')?.getAttribute('data-mock-initial')).toBeNull()
    expect(byEntity('lbl')?.closest('[data-presentation-appear]')).toBeNull()
    expect(byEntity('lbl')?.hasAttribute('appear')).toBe(false) // never leaks to the DOM
  })

  it('Appear starts hidden and enters only after the layout transition has finished', () => {
    render(<Appear data-testid="enter" />)
    const el = document.querySelector('[data-testid="enter"]')
    expect(parse(el, 'data-mock-initial')).toEqual({ opacity: 0 })
    const animate = parse(el, 'data-mock-animate')
    expect(animate.opacity).toBe(1)
    expect(startsAfterLayout(animate.transition)).toBe(true)
    expect(animate.transition.delay).toBe(ENTER_DELAY)
    expect(ENTER_ANIMATE.transition.delay).toBe(ENTER_DELAY)
  })

  it('the settle predicate rejects an entrance that could start before layout motion ends', () => {
    expect(startsAfterLayout({ delay: LAYOUT_T.duration })).toBe(true) // equality passes
    expect(startsAfterLayout({ delay: LAYOUT_T.duration + 0.1 })).toBe(true)
    expect(startsAfterLayout({ delay: 0.2 })).toBe(false)
    expect(startsAfterLayout({})).toBe(false)
  })
})

describe('departing entities', () => {
  it('keyed layer children sit in a presence boundary and carry an exit', () => {
    const { rerender } = render(
      <SceneLayer>
        <Box key="stay" id="stay" />
        <Box key="leave" id="leave" />
      </SceneLayer>,
    )
    const leaver = byEntity('leave')!
    expect(leaver.closest('[data-mock-presence]')).not.toBeNull()
    expect(parse(leaver, 'data-mock-exit')).toMatchObject({ opacity: 0 })
    expect(parse(leaver, 'data-mock-exit').transition.delay).toBe(0)
    rerender(
      <SceneLayer>
        <Box key="stay" id="stay" />
      </SceneLayer>,
    )
    expect(byEntity('leave')).toBeNull()
    expect(byEntity('stay')).not.toBeNull()
  })

  it('Appear, arrows and the scene wrapper also exit', () => {
    render(
      <Stage step={makeSteps(['a'])[0]} mode="browse" />,
    )
    expect(parse(document.querySelector('[data-presentation-scene]'), 'data-mock-exit')).toEqual(EXIT_ANIMATE)
    render(<Appear data-testid="ap" />)
    expect(parse(document.querySelector('[data-testid="ap"]'), 'data-mock-exit')).toEqual(EXIT_ANIMATE)
    render(<Arrow id="arrow" from={[0, 0]} to={[1, 1]} />)
    expect(parse(byEntity('arrow'), 'data-mock-exit')).toEqual(EXIT_ANIMATE)
  })
})

describe('stage hosting', () => {
  it('wraps the scene in LayoutGroup + AnimatePresence and cross-fades ungrouped steps', () => {
    const steps = makeSteps(['a', 'b'])
    const { rerender } = render(<Stage step={steps[0]} mode="browse" />)
    const first = document.querySelector('[data-presentation-scene]')!
    expect(first.closest('[data-mock-presence]')?.closest('[data-mock-layout-group]')).not.toBeNull()
    expect(parse(first, 'data-mock-initial')).toEqual({ opacity: 0 })
    expect(parse(first, 'data-mock-animate')).toEqual({ opacity: 1 })
    rerender(<Stage step={steps[1]} mode="browse" />)
    const scenes = document.querySelectorAll('[data-presentation-scene]')
    expect(scenes[scenes.length - 1]).not.toBe(first) // ungrouped: a different keyed scene
  })
})

describe('intentional composition', () => {
  it('keeps supplied coordinates and stacking order, in independent absolute layers', () => {
    const view = (
      <>
        <SceneLayer data-testid="one">
          <Box key="under" id="under" x={10} y={10} width={100} height={100} style={{ zIndex: 1 }} />
          <Box key="over" id="over" x={50} y={50} width={100} height={100} style={{ zIndex: 2 }} />
        </SceneLayer>
        <SceneLayer data-testid="two" />
      </>
    )
    const { rerender } = render(view)
    const style = (id: string) => (byEntity(id) as HTMLElement).style
    expect([style('under').left, style('under').top, style('under').zIndex]).toEqual(['10px', '10px', '1'])
    expect([style('over').left, style('over').top, style('over').zIndex]).toEqual(['50px', '50px', '2'])
    expect(style('over').position).toBe('absolute')
    const order = [...document.querySelectorAll('[data-presentation-entity]')].map((n) => n.getAttribute('data-presentation-entity'))
    expect(order).toEqual(['under', 'over'])
    rerender(view) // payload-like re-render leaves coordinates untouched
    expect(style('over').left).toBe('50px')
    for (const layer of document.querySelectorAll<HTMLElement>('[data-presentation-scene-layer]')) {
      expect([layer.style.position, layer.style.width, layer.style.height]).toEqual(['absolute', '100%', '100%'])
    }
  })

  it('does not auto-position a node without coordinates', () => {
    render(<Box id="free" />)
    expect((byEntity('free') as HTMLElement).style.position).toBe('')
  })

  it('renders raw motion elements with layoutIds beside primitives', async () => {
    const { motion } = await import('motion/react')
    render(
      <SceneLayer>
        <Box key="a" id="a" />
        <motion.div key="raw" layoutId="raw" data-presentation-entity="raw" style={{ position: 'absolute', left: 3, top: 4 }} />
      </SceneLayer>,
    )
    expect(byEntity('raw')?.getAttribute('data-mock-layout-id')).toBe('raw')
    expect((byEntity('raw') as HTMLElement).style.left).toBe('3px')
  })

  it('renders a glyph in Box only when an icon component is supplied', () => {
    render(
      <>
        <Box id="with" Icon={Check} />
        <Box id="without" />
      </>,
    )
    expect(byEntity('with')?.querySelector('svg[data-presentation-icon]')).not.toBeNull()
    expect(byEntity('without')?.querySelector('svg')).toBeNull()
  })
})

describe('sample continuity (structural)', () => {
  const nodes = () =>
    new Map([...document.querySelectorAll('[data-presentation-entity]')].map((n) => [n.getAttribute('data-presentation-entity')!, n]))

  it('keeps continuing entity nodes unwrapped and unfaded; only the introducing step fades newcomers', () => {
    const { rerender } = render(<SampleScene payload={{ n: 3 }} />)
    const before = nodes()
    expect(before.has('step-card-2')).toBe(false)
    rerender(<SampleScene payload={{ n: 4 }} />)
    for (const [id, node] of before) {
      expect(byEntity(id!)).toBe(node) // same element: layoutId morph, no remount
      expect(node.closest('[data-presentation-appear]')).toBeNull() // no newcomer-fade ancestor
      expect(node.getAttribute('data-mock-initial')).toBeNull() // no newcomer fade on the element
    }
    const card = byEntity('step-card-2')!
    expect(card.closest('[data-presentation-appear]')).toBeNull()
    expect(parse(card, 'data-mock-initial')).toEqual({ opacity: 0 })
    expect(parse(card, 'data-mock-animate').transition.delay).toBeGreaterThanOrEqual(LAYOUT_T.delay + LAYOUT_T.duration)
    expect(byEntity('you')?.getAttribute('data-mock-layout-id')).toBe('you')
  })

  it('keeps newcomer marking stable across re-renders of the same step, and never marks on the way back', () => {
    const { rerender } = render(<SampleScene payload={{ n: 3 }} />)
    rerender(<SampleScene payload={{ n: 4 }} />)
    const marked = () => [...nodes()].filter(([, n]) => n.hasAttribute('data-mock-initial')).map(([id]) => id).sort()
    const expected = ['link-1-2', 'link-2-3', 'morph-label-1-2', 'morph-label-2-3', 'step-card-2', 'step-card-3']
    expect(marked()).toEqual(expected)
    rerender(<SampleScene payload={{ n: 4 }} />)
    expect(marked()).toEqual(expected)
    rerender(<SampleScene payload={{ n: 3 }} />)
    expect(marked()).toEqual([]) // stepping back introduces nothing
    expect(byEntity('step-card-2')).toBeNull()
  })
})
