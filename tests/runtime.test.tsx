import { useEffect, useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { STAGE_LAYOUT, LAYOUT_T, ENTER_T, DESIGN_W, DESIGN_H } from '../src/presentation-kit/constants'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import type { Step, SceneProps } from '../src/presentation-kit/types'
import { GuideScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { readFileSync } from 'node:fs'
import { positions, entity } from '../src/presentations/how-to-make-a-presentation/entities'
const guideCSS = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')

vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react')
  const element = (tag: string) => function Motion({ layoutId, layout, initial, animate, exit, transition, children, ...props }: Record<string, unknown>) {
    return createElement(tag, { ...props, 'data-motion': JSON.stringify({ layoutId, layout, initial, animate, exit, transition }) }, children as import('react').ReactNode)
  }
  return { useInstantLayoutTransition: () => () => {}, motion: { div: element('div'), svg: element('svg') }, LayoutGroup: ({ children }: { children: import('react').ReactNode }) => createElement(Fragment, null, children), AnimatePresence: ({ children }: { children: import('react').ReactNode }) => createElement(Fragment, null, children) }
})
function Scene({ payload }: SceneProps<number>) { return <Box entityId="stable" style={{ position: 'absolute', left: payload, top: 20 }}>payload {payload}</Box> }
const steps: Step<number>[] = [0, 1, 2].map(i => ({ id: `id-${i}`, era: i < 2 ? 'start' : 'end', title: `Title ${i}`, caption: `Caption ${i}`, Scene, groupKey: 'story', payload: i }))
const root = () => document.querySelector('[data-presentation]')!
const index = () => Number(root().getAttribute('data-step-index'))
const key = (value: string, target: Element | Window = window) => fireEvent.keyDown(target, { key: value })
const mode = () => root().getAttribute('data-presentation-mode')
function resize(width: number, height: number) { act(() => { Object.defineProperty(window, 'innerWidth', { value: width, configurable: true }); Object.defineProperty(window, 'innerHeight', { value: height, configurable: true }); window.dispatchEvent(new Event('resize')) }) }
function swipe(x: number, y = 0) { fireEvent.touchStart(root(), { touches: [{ clientX: 200, clientY: 100 }] }); fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 200 + x, clientY: 100 + y }] }) }
const motionData = (element: Element) => JSON.parse(element.getAttribute('data-motion')!)

describe('I-13 step model', () => {
  it('derives narration and numbering from inserted removed and reordered step positions', () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />)
    expect(screen.getByRole('heading').textContent).toBe('Title 0')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('01 / start')
    const reordered = [steps[2], steps[0]]
    rerender(<Presentation steps={reordered} title="Test" />)
    expect(screen.getByRole('heading').textContent).toBe('Title 2')
    expect(screen.getByLabelText('Step 1: Title 2').textContent).toBe('1')
    rerender(<Presentation steps={[steps[1], ...reordered]} title="Test" />)
    key('ArrowRight')
    expect(screen.getByRole('heading').textContent).toBe('Title 2')
    expect(screen.getByText('Caption 2')).toBeTruthy()
    expect(screen.getByText('payload 2')).toBeTruthy()
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('02 / end')
  })
  it('rejects empty presentations explicitly', () => { expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step') })
})
describe('I-15 entity lifecycle', () => {
  it('keeps layout identity across state changes and wires delayed enter and immediate exit', () => {
    const { container, rerender } = render(<Scene payload={5} />)
    const node = container.firstElementChild!
    expect(motionData(node)).toMatchObject({ layoutId: 'stable', layout: true, transition: { layout: LAYOUT_T } })
    rerender(<Scene payload={80} />)
    expect(container.firstElementChild).toBe(node)
    expect((node as HTMLElement).style.left).toBe('80px')
    const appear = render(<Appear>new</Appear>).container.firstElementChild!
    expect(motionData(appear)).toMatchObject({ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.18 } }, transition: ENTER_T })
    expect(ENTER_T.delay).toBeGreaterThan(LAYOUT_T.duration)
  })
})
describe('I-16 grouped persistence', () => {
  it('preserves instance on payload change and replaces on group or scene change', () => {
    let mounts = 0, unmounts = 0
    function Counted({ payload }: SceneProps<number>) { const [token] = useState(() => ++mounts); useEffect(() => () => { unmounts++ }, []); return <span>{token}:{payload}</span> }
    const step = { ...steps[0], Scene: Counted }
    const { rerender } = render(<Stage namespace="t" mode="browse" step={step} />)
    rerender(<Stage namespace="t" mode="browse" step={{ ...step, id: 'second', payload: 2 }} />)
    expect(mounts).toBe(1); expect(unmounts).toBe(0); expect(screen.getByText('1:2')).toBeTruthy()
    rerender(<Stage namespace="t" mode="browse" step={{ ...step, groupKey: 'other' }} />)
    expect(mounts).toBe(2); expect(unmounts).toBe(1)
    rerender(<Stage namespace="t" mode="browse" step={{ ...step, groupKey: 'other', Scene }} />)
    expect(unmounts).toBe(2)
  })
  it('does not rerun newcomer opacity for continuing entities in grouped sample updates', () => {
    const { container, rerender } = render(<GuideScene payload={1} />)
    const you = container.querySelector('[data-entity="you"]')!
    const wrapper = you.parentElement!
    expect(motionData(wrapper).initial).toEqual({ opacity: 0 })
    expect(motionData(wrapper).animate).toEqual({ opacity: 1 })
    rerender(<GuideScene payload={2} />)
    expect(container.querySelector('[data-entity="you"]')?.parentElement).toBe(wrapper)
  })
})
describe('I-17 layers and intentional geometry', () => {
  it('preserves authored stacking and coordinates without reflow', () => {
    const { container, rerender } = render(<SceneLayer style={{ zIndex: 2 }}><Box entityId="a" style={{ position: 'absolute', left: 10, top: 10, zIndex: 3 }}>a</Box></SceneLayer>)
    const layer = container.firstElementChild as HTMLElement
    expect(layer.style.position).toBe('absolute'); expect(parseFloat(layer.style.inset)).toBe(0); expect(layer.style.zIndex).toBe('2')
    rerender(<SceneLayer style={{ zIndex: 2 }}><Box entityId="a" style={{ position: 'absolute', left: 10, top: 10, zIndex: 3 }}>a</Box><Box entityId="b" style={{ position: 'absolute', left: 10, top: 10 }}>b</Box></SceneLayer>)
    expect((screen.getByText('a') as HTMLElement).style.left).toBe('10px'); expect((screen.getByText('a') as HTMLElement).style.zIndex).toBe('3')
  })
})
describe('I-18 primitive hooks', () => {
  it.each([Box, Label, Arrow, Frame, Emphasis, SymbolChip])('forwards identity class data and coordinate style without fallback visual defaults: %s', Primitive => {
    const { container } = render(<Primitive entityId="author:id" className="author" data-presentation-custom="x" style={{ position: 'absolute', left: 42 }}>text</Primitive>)
    const node = container.firstElementChild as HTMLElement
    expect(motionData(node).layoutId).toBe('author:id'); expect(node.className).toBe('author'); expect(node.dataset.presentationCustom).toBe('x')
    expect(node.style.left).toBe('42px'); expect(node.style.color).toBe(''); expect(node.style.border).toBe(''); expect(node.style.fontFamily).toBe(''); expect(node.style.background).toBe('')
  })
  it('forwards hooks on Appear and SceneLayer', () => {
    const { container } = render(<SceneLayer className="layer" data-presentation-custom="yes"><Appear className="new" data-presentation-custom="new" style={{ left: 9 }}>a</Appear></SceneLayer>)
    expect(container.querySelector('.layer')?.getAttribute('data-presentation-layer')).toBe('')
    expect(container.querySelector('.new')?.getAttribute('data-presentation-appear')).toBe('')
    expect((container.querySelector('.new') as HTMLElement).style.left).toBe('9px')
  })
})
describe('I-19 attribution and branding', () => {
  it('defaults to repository disclosure at bottom-right with no header brand; accepts opt-in brand', () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene'); expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect((link.parentElement as HTMLElement).style.right).toBe('24px'); expect((link.parentElement as HTMLElement).style.bottom).toBe('18px')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    rerender(<Presentation steps={steps} title="Test" brand={<a href="/">Host</a>} />)
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('Host')
  })
})
describe('I-20 mode chrome', () => {
  it('renders browse narration navigation and wide-only sections', () => {
    resize(1440,900); render(<Presentation steps={steps} title="Test" />)
    for (const hook of ['caption','toc','progress','prev','next','title']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeTruthy()
    resize(390,844); expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })
  it('honors initial present mode with title/marker and without reading chrome', () => {
    render(<Presentation steps={steps} title="Test" initialMode="present" />)
    expect(mode()).toBe('present'); expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
    expect(document.querySelector('[data-presentation-present-title]')?.textContent).toBe('Title 0')
    for (const hook of ['caption','toc','progress','prev','next']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
  })
})
describe('I-21 mode position', () => {
  it('toggles by P and control without losing current step or grouped instance', () => {
    render(<Presentation steps={steps} title="Test" />); key('ArrowRight')
    const canvas = document.querySelector('[data-presentation-canvas]')!
    const scene = document.querySelector('[data-presentation-node]')!
    key('p'); expect(mode()).toBe('present'); expect(index()).toBe(1)
    expect(document.querySelector('[data-presentation-node]')).toBe(scene)
    expect((document.querySelector('[data-presentation-stage-slot]') as HTMLElement).style.top).toBe(`${STAGE_LAYOUT.present.top}px`)
    fireEvent.click(screen.getByLabelText('Toggle presentation mode')); expect(mode()).toBe('browse'); expect(index()).toBe(1)
    expect(document.querySelector('[data-presentation-canvas]')).toBe(canvas)
  })
})
describe('I-22 keyboard', () => {
  it.each(['ArrowRight',' ','PageDown'])('advances once for %s', k => { render(<Presentation steps={steps} title="Test" />); key(k); expect(index()).toBe(1) })
  it.each(['ArrowLeft','PageUp'])('retreats once for %s', k => { render(<Presentation steps={steps} title="Test" />); key('ArrowRight'); key(k); expect(index()).toBe(0) })
  it.each(['button','input','select','textarea','a','editable'])('leaves focused %s key handling alone', tag => {
    render(<Presentation steps={steps} title="Test" />)
    const control = document.createElement(tag === 'editable' ? 'div' : tag)
    if (tag === 'editable') control.setAttribute('contenteditable','true')
    document.body.append(control)
    for (const k of ['ArrowRight',' ','PageDown','ArrowLeft','PageUp','p']) key(k, control)
    expect(index()).toBe(0); expect(mode()).toBe('browse'); control.remove()
  })
  it('ignores unrelated and modified keys and cleans up listeners on unmount', () => {
    const { unmount } = render(<Presentation steps={steps} title="Test" />)
    key('a'); fireEvent.keyDown(window,{ key: 'ArrowRight', ctrlKey:true }); expect(index()).toBe(0)
    unmount(); render(<Presentation steps={steps} title="Again" />); key('ArrowRight'); expect(index()).toBe(1)
  })
})
describe('I-23 touch and controls', () => {
  it('handles both horizontal directions and ignores vertical/small swipes', () => {
    render(<Presentation steps={steps} title="Test" />)
    swipe(-100); expect(index()).toBe(1); swipe(100); expect(index()).toBe(0)
    swipe(-20); swipe(-50,200); expect(index()).toBe(0)
    fireEvent.click(screen.getByLabelText('Next step')); expect(index()).toBe(1)
    fireEvent.click(screen.getByLabelText('Previous step')); expect(index()).toBe(0)
  })
})
describe('I-24 direct jumps and current semantics', () => {
  it('jumps to a step and first step of an era with active semantic/data hooks', () => {
    resize(1440,900); render(<Presentation steps={steps} title="Test" />)
    fireEvent.click(screen.getByLabelText('Step 2: Title 1')); expect(index()).toBe(1)
    expect(screen.getByLabelText('Step 2: Title 1').getAttribute('aria-current')).toBe('step')
    expect(screen.getByLabelText('Step 2: Title 1').getAttribute('data-presentation-active')).toBe('true')
    expect(screen.getByRole('button',{name:'start'}).getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button',{name:'end'})); expect(index()).toBe(2)
    fireEvent.click(screen.getByRole('button',{name:'start'})); expect(index()).toBe(0)
    expect(screen.getByRole('button',{name:'end'}).hasAttribute('aria-current')).toBe(false)
  })
})
describe('I-25 boundaries', () => {
  it('clamps start and end for keyboard touch and buttons without wrap', () => {
    render(<Presentation steps={steps} title="Test" />)
    key('ArrowLeft'); swipe(100); fireEvent.click(screen.getByLabelText('Previous step')); expect(index()).toBe(0)
    key('ArrowRight'); key('ArrowRight'); key('ArrowRight'); swipe(-100); fireEvent.click(screen.getByLabelText('Next step')); expect(index()).toBe(2)
  })
})
describe('I-26 canvas fit', () => {
  it.each(['browse','present'] as const)('fits wide narrow height-constrained and tiny viewports uniformly in %s', mode => {
    for (const [w,h] of [[1440,900],[390,844],[1440,420],[40,40]]) {
      const s=fitScale(w,h,mode), g=STAGE_LAYOUT[mode]
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s * DESIGN_W).toBeLessThanOrEqual(Math.max(0,w-g.horizontal*2-(w>=1100?g.toc:0)))
      expect(s * DESIGN_H).toBeLessThanOrEqual(Math.max(0,h-g.top-g.bottom))
    }
  })
  it('keeps fixed dimensions and scale between steps and uniformly updates on resize', () => {
    resize(1440,900); render(<Presentation steps={steps} title="Test" />)
    const canvas=document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
    const scale=canvas.style.transform; key('ArrowRight'); expect(canvas.style.transform).toBe(scale)
    resize(390,844); expect(Number(canvas.style.transform.match(/[\d.]+/)![0])).toBeCloseTo(fitScale(390,844,'browse'),5)
    expect((document.querySelector('[data-presentation-node]') as HTMLElement).style.top).toBe('20px')
  })
})
describe('I-29 sample early beats', () => {
  it('accumulates conversation and cards at stable coordinates over beats 1–5', () => {
    const { container, rerender }=render(<GuideScene payload={1} />)
    const seen=new Map<string,Element>()
    const expected=[['you','prompt'],['skill','conversation','question'],['tray','card1','morph1'],['card2','card3','morph2'],['ghost','depth']]
    for (let beat=1;beat<=5;beat++) {
      rerender(<GuideScene payload={beat} />)
      for (const name of expected[beat-1]) expect(container.querySelector(`[data-entity="${name}"]`)).toBeTruthy()
      const morph = container.querySelector('[data-entity="morph1"]')
      if (beat < 3) expect(morph).toBeNull()
      if (beat === 3) {
        expect(morph?.textContent).toContain('morph')
        expect(container.querySelector('[data-entity="card1"]')?.contains(morph)).toBe(false)
        expect(positions.morph1[0]).toBeGreaterThan(positions.card1[0] + positions.card1[2])
        expect(positions.morph1[0] + positions.morph1[2]).toBeLessThanOrEqual(positions.card2[0])
      }
      for (const [name,node] of seen) expect(container.querySelector(`[data-entity="${name}"]`)).toBe(node)
      container.querySelectorAll('[data-entity]').forEach(node=>{
        const name=node.getAttribute('data-entity')! as keyof typeof positions
        expect(motionData(node).layoutId).toBe(entity(name))
        expect((node.parentElement as HTMLElement).style.left).toBe(`${positions[name][0]}px`)
        seen.set(name,node)
      })
    }
    expect(container.querySelector('[data-entity="card1"]')?.textContent).toContain('title · caption · visual')
    expect(container.querySelector('[data-entity="morph1"]')?.textContent).toContain('morph')
  })
})
describe('I-30 sample later beats', () => {
  it('adds kit socket verification edit arc and final reveal without replacing accumulated entities', () => {
    const view = (beat: number) => <div className="field-guide"><style>{guideCSS}</style><GuideScene payload={beat} /></div>
    const { container, rerender }=render(view(5))
    const you=container.querySelector('[data-entity="you"]'), card=container.querySelector('[data-entity="card2"]')
    for (let beat=6;beat<=9;beat++) {
      rerender(view(beat))
      expect(container.querySelector('[data-entity="you"]')).toBe(you); expect(container.querySelector('[data-entity="card2"]')).toBe(card)
      expect(container.querySelector('[data-entity="kit"]')?.textContent).toContain('shared scene kit')
      expect(positions.kit[1]).toBe(positions.tray[1]+positions.tray[3]-3)
      const trayStyle = getComputedStyle(container.querySelector('[data-entity="tray"]')!)
      for (const edge of [trayStyle.borderTopWidth, trayStyle.borderLeftWidth, trayStyle.borderRightWidth]) expect(parseFloat(edge) || 0).toBe(0)
      expect(parseFloat(trayStyle.borderBottomWidth)).toBeGreaterThan(0)
      if (beat>=7) {
        const verify = container.querySelector('[data-entity="verify"]')!
        expect(verify.querySelector('svg.lucide-check')).toBeTruthy()
        const rgb = getComputedStyle(verify).color.match(/\d+/g)!.map(Number)
        expect(rgb[1]).toBeGreaterThan(rgb[0]); expect(rgb[1]).toBeGreaterThan(rgb[2])
        expect(container.querySelector('[data-entity="verify"]')?.textContent).toContain('build + render / pass'); expect(positions.verify[1]).toBe(positions.card1[1]); expect(positions.verify[0]).toBeGreaterThan(positions.card3[0]) }
      if (beat>=8) {
        const path = container.querySelector('[data-entity="modify"] path')!
        expect(path.getAttribute('d')).toMatch(/^M [\d ]+ C [\d ]+ L [\d ]+$/)
        const coords = path.getAttribute('d')!.match(/\d+/g)!.map(Number)
        const [sx, sy] = coords, [ex, ey] = coords.slice(-2)
        expect(sx).toBeGreaterThanOrEqual(positions.skill[0]); expect(sx).toBeLessThanOrEqual(positions.skill[0] + positions.skill[2])
        expect(sy).toBeGreaterThanOrEqual(positions.skill[1] + positions.skill[3]); expect(sy).toBeLessThanOrEqual(positions.skill[1] + positions.skill[3] + 10)
        expect(ex).toBeGreaterThan(positions.card2[0]); expect(ex).toBeLessThan(positions.card2[0] + positions.card2[2])
        expect(ey).toBeLessThanOrEqual(positions.card2[1]); expect(ey).toBeGreaterThan(positions.card2[1] - 10)
        expect(card?.classList.contains('edited')).toBe(true) }
      if (beat>=9) expect(container.querySelector('[data-entity="reveal"]')?.textContent).toContain("YOU'RE IN IT")
    }
  })
})
