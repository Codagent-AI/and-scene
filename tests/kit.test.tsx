import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer, Appear } from '../src/presentation-kit/nodes/primitives'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import type { SceneProps, Step } from '../src/presentation-kit/types'

function Scene({ payload }: SceneProps<string>) { return <p data-testid="scene">{payload}</p> }
const steps: Step<string>[] = ['Alpha', 'Beta', 'Gamma'].map((title, i) => ({ id: title, era: i < 2 ? 'start' : 'end', title, caption: `${title} caption`, Scene, payload: `${title} diagram`, groupKey: 'shared' }))
function show(initialMode: 'browse' | 'present' = 'browse') { return render(<Presentation steps={steps} title="Test presentation" initialMode={initialMode} />) }
const index = () => document.querySelector('[data-presentation]')?.getAttribute('data-step-index')
function key(key: string, target: Element | Window = window) { fireEvent.keyDown(target, { key }) }
function swipe(el: Element, dx: number, dy = 0) {
  fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 200 }] })
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] })
}

describe('Step contracts and chrome', () => {
  it('I-1 active identity narration and diagram follow the step', () => {
    show(); expect(screen.getByRole('heading').textContent).toBe('Alpha'); expect(screen.getByTestId('scene').textContent).toBe('Alpha diagram')
    expect(document.querySelector('[data-step-id]')?.getAttribute('data-step-id')).toBe('Alpha')
    key('ArrowRight'); expect(index()).toBe('1'); expect(screen.getByRole('heading').textContent).toBe('Beta'); expect(screen.getByText('Beta caption')).toBeTruthy(); expect(screen.getByTestId('scene').textContent).toBe('Beta diagram')
  })
  it('I-2 numbering follows reordered shortened arrays', () => {
    const { rerender } = render(<Presentation steps={[steps[2], steps[0]]} title="Test" />)
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('01 / end')
    key('ArrowRight'); expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('02 / start')
    rerender(<Presentation steps={[steps[1]]} title="Test" />)
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('01 / start')
  })
  it('I-10 default attribution and opt-in brand', () => {
    const { rerender } = show()
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.parentElement?.style.right).toBe('0px'); expect(link.parentElement?.style.bottom).toBe('0px')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    rerender(<Presentation steps={steps} title="Test" brand={<a href="/">Host</a>} />)
    expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
  })
  it('I-11 present mode is title-focused', () => {
    show('present'); expect(screen.getByRole('heading').textContent).toBe('Alpha')
    expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
    for (const hook of ['caption', 'toc', 'nav']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
  })
  it('I-12 browse chrome includes caption progress and responsive ToC', () => {
    window.innerWidth = 1400
    show(); expect(screen.getByText('Alpha caption')).toBeTruthy(); expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next step' })).toBeTruthy(); expect(document.querySelectorAll('[data-presentation-progress-item]').length).toBe(3)
    act(() => { window.innerWidth = 390; window.dispatchEvent(new Event('resize')) })
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    act(() => { window.innerWidth = 1400; window.dispatchEvent(new Event('resize')) })
  })
  it('I-13 initial mode and both toggles preserve active index', () => {
    show('present'); key('ArrowRight'); key('p'); expect(index()).toBe('1')
    expect(document.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('browse')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle presentation mode' })); expect(index()).toBe('1')
    expect(document.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('present')
  })
  it('I-16 direct progress and era jumps use array positions', () => {
    window.innerWidth = 1400; show()
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: Beta' })); expect(index()).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'end', exact: true })); expect(index()).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'start', exact: true })); expect(index()).toBe('0')
  })
  it('I-17 semantic current state and stable active hooks track jumps', () => {
    window.innerWidth = 1400; show(); fireEvent.click(screen.getByRole('button', { name: 'Step 3: Gamma' }))
    expect(screen.getByRole('button', { name: 'Step 3: Gamma' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: 'end', exact: true }).getAttribute('data-presentation-active')).toBe('true')
    expect(screen.getByRole('button', { name: 'Step 1: Alpha' }).getAttribute('aria-current')).toBeNull()
  })
  it('I-33 captions change with next and previous controls', () => {
    show(); fireEvent.click(screen.getByRole('button', { name: 'Next step' })); expect(screen.getByText('Beta caption')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' })); expect(screen.getByText('Alpha caption')).toBeTruthy()
  })
  it('rejects an empty presentation with an actionable error', () => {
    expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('requires at least one step')
  })
})

describe('Navigation', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('I-14 next key %s advances exactly once and prevents default', value => {
    const { result } = renderHook(() => usePresentationNav(3))
    const event = new KeyboardEvent('keydown', { key: value, cancelable: true })
    act(() => window.dispatchEvent(event)); expect(result.current.index).toBe(1); expect(event.defaultPrevented).toBe(true)
  })
  it.each(['ArrowLeft', 'PageUp'])('I-14 previous key %s retreats exactly once', value => {
    const { result } = renderHook(() => usePresentationNav(3)); act(() => result.current.jump(2)); act(() => key(value)); expect(result.current.index).toBe(1)
  })
  it('I-15 horizontal swipes navigate; vertical and small gestures do not', () => {
    show(); const el = document.querySelector('[data-presentation]')!
    swipe(el, -100); expect(index()).toBe('1'); swipe(el, 100); expect(index()).toBe('0')
    swipe(el, -20); swipe(el, -100, 150); expect(index()).toBe('0')
  })
  it.each(['button','a','input','textarea','select','div'])('I-18 focused %s owns navigation keys', tag => {
    show(); const control = document.createElement(tag)
    if (tag === 'a') control.setAttribute('href', '#')
    if (tag === 'div') control.setAttribute('contenteditable', 'true')
    document.body.append(control); control.focus()
    for (const value of ['ArrowRight',' ','PageDown','ArrowLeft','PageUp','p']) key(value, control)
    expect(index()).toBe('0'); expect(document.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('browse'); control.remove()
  })
  it('I-19 all input paths clamp at start and end', () => {
    show(); const el = document.querySelector('[data-presentation]')!
    key('ArrowLeft'); swipe(el, 100); fireEvent.click(screen.getByRole('button', { name: 'Previous step' })); expect(index()).toBe('0')
    key('ArrowRight'); key('ArrowRight'); key('ArrowRight'); swipe(el, -100); fireEvent.click(screen.getByRole('button', { name: 'Next step' })); expect(index()).toBe('2')
  })
})

describe('Continuity and geometry', () => {
  it('I-5 newcomer sequencing starts after continuing motion', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration); expect(ENTER_T.delay).toBe(ENTER_DELAY)
    const { container } = render(<Appear><span>new</span></Appear>); expect(container.querySelector('[data-presentation-appear]')).toBeTruthy()
  })
  it('I-6 grouped scene persists while payload updates; changed component remounts', () => {
    const mount = vi.fn(), unmount = vi.fn()
    function Persistent({ payload }: SceneProps<string>) { useEffect(() => { mount(); return unmount }, []); return <span>{payload}</span> }
    const { rerender } = render(<Stage step={{ ...steps[0], Scene: Persistent }} mode="browse" />)
    rerender(<Stage step={{ ...steps[1], Scene: Persistent }} mode="browse" />)
    expect(mount).toHaveBeenCalledTimes(1); expect(unmount).not.toHaveBeenCalled(); expect(screen.getByText('Beta diagram')).toBeTruthy()
    rerender(<Stage step={{ ...steps[2], Scene }} mode="browse" />)
    expect(screen.getByText('Gamma diagram')).toBeTruthy()
  })
  it('I-4 I-7 I-8 continuing nodes retain identity and authored coordinates/hooks', () => {
    const { rerender, container } = render(<SceneLayer><Box entityId="same" className="local" data-example="yes" style={{ position: 'absolute', left: 12, top: 18, width: 80 }}>before</Box><Label entityId="overlap" style={{ position: 'absolute', left: 12, top: 18 }}>stack</Label></SceneLayer>)
    const box = container.querySelector('[data-presentation-entity="same"]')
    rerender(<SceneLayer><Box entityId="same" className="local" data-example="yes" style={{ position: 'absolute', left: 90, top: 18, width: 100 }}>after</Box><Label entityId="overlap" style={{ position: 'absolute', left: 12, top: 18 }}>stack</Label></SceneLayer>)
    expect(container.querySelector('[data-presentation-entity="same"]')).toBe(box)
    expect(box?.textContent).toBe('after'); expect(box?.getAttribute('data-example')).toBe('yes'); expect(box?.className).toBe('local')
    expect((container.querySelector('[data-presentation-entity="overlap"]') as HTMLElement).style.left).toBe('12px')
    expect((container.querySelector('[data-presentation-layer]') as HTMLElement).style.position).toBe('absolute')
  })
  it('I-8 all generic primitives expose author hooks', () => {
    const components = [Box,Label,Arrow,Frame,Emphasis,SymbolChip]
    const { container } = render(<>{components.map((Component, i) => <Component key={i} entityId={`n${i}`} style={{ left: 25 }} className="local" data-custom="hook">text</Component>)}</>)
    expect(container.querySelectorAll('[data-presentation-node][data-custom="hook"]').length).toBe(6)
  })
  it('I-9 unstyled primitives contain no visual defaults', () => {
    const { container } = render(<Box entityId="plain">plain</Box>)
    const style = (container.firstChild as HTMLElement).style
    for (const property of ['color','fontFamily','border','boxShadow','background','padding']) expect(style.getPropertyValue(property)).toBe('')
  })
  it.each(['browse','present'] as const)('I-20 uniform fit across viewport sizes in %s', mode => {
    expect(fitScale(1440, 900, mode)).toBe(1)
    for (const [w, h] of [[390,844],[1200,500],[320,400]]) {
      const scale = fitScale(w,h,mode); expect(scale).toBeGreaterThan(0); expect(scale).toBeLessThanOrEqual(1)
      expect(880*scale).toBeLessThanOrEqual(w); expect(380*scale).toBeLessThanOrEqual(h)
    }
    const { container, rerender } = render(<Stage step={steps[0]} mode={mode} />)
    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
    const transform = canvas.style.transform; rerender(<Stage step={steps[1]} mode={mode} />); expect(canvas.style.transform).toBe(transform)
  })
  it.each(['browse','present'] as const)('I-20 stage track is viewport-bounded so a scaled canvas stays centered in %s', mode => {
    const { container } = render(<Stage step={steps[0]} mode={mode} />)
    const stage = container.querySelector('[data-presentation-stage]') as HTMLElement
    expect(stage.style.gridTemplateColumns).toBe('minmax(0, 1fr)'); expect(stage.style.gridTemplateRows).toBe('minmax(0, 1fr)')
  })
})
