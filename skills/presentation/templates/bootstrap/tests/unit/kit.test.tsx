// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { Presentation, Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, SceneLayer, fitGeometry, DESIGN_W, DESIGN_H, ENTER_DELAY, LAYOUT_T } from '../../src/presentation-kit'
import { usePresentationNav } from '../../src/presentation-kit/usePresentationNav'
import type { SceneProps, Step } from '../../src/presentation-kit'
import { readFileSync } from 'node:fs'

vi.mock('motion/react', async () => {
  const React = await import('react')
  return {
    LayoutGroup: ({ children }: { children: React.ReactNode }) => children,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: { div: React.forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => {
      const { children, layout, layoutId, initial, animate, exit, transition, ...rest } = props
      return <div {...rest} ref={ref} data-motion={JSON.stringify({ layout, layoutId, initial, animate, exit, transition })}>{children as React.ReactNode}</div>
    }) },
  }
})
afterEach(cleanup)
function Scene({ payload }: SceneProps<number>) { return <Box id="continuing" style={{ left: payload }}>diagram {payload}</Box> }
const steps: Step<number>[] = [0, 1, 2].map(n => ({ id: `s${n}`, era: n < 2 ? 'ask' : 'build', title: `Title ${n}`, caption: `Caption ${n}. More narration.`, Scene, payload: n, groupKey: 'shared' }))
function wide() { Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1400 }); Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 }) }
function host(container: HTMLElement) { return container.querySelector('[data-presentation]')! }

describe('scene contracts', () => {
  it('I-1 renders metadata and the active diagram state', () => {
    const { container, getByText } = render(<Presentation title="Example" steps={steps} />)
    expect(host(container).getAttribute('data-step-count')).toBe('3')
    expect(getByText('Title 0')).toBeTruthy()
    expect(getByText('Caption 0. More narration.')).toBeTruthy()
    expect(getByText('diagram 0')).toBeTruthy()
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('1 / ask')
  })
  it('I-2 derives numbering after insertion reordering and deletion', () => {
    const { container, rerender } = render(<Presentation title="Example" steps={[steps[2], steps[0], steps[1]]} />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('1 / build')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('2 / ask')
    rerender(<Presentation title="Example" steps={[{ ...steps[2], id: 'inserted' }, ...steps]} />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('2 / ask')
    rerender(<Presentation title="Example" steps={[steps[1]]} />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('1 / ask')
  })
  it('I-4 propagates stable layout identity and author morph state', () => {
    const { container } = render(<Presentation title="Example" steps={steps} />)
    const entity = container.querySelector('[data-presentation-entity="continuing"]')!
    expect(JSON.parse(entity.getAttribute('data-motion')!).layoutId).toBe('continuing')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(container.querySelector('[data-presentation-entity="continuing"]')).toBe(entity)
    expect(entity.getAttribute('style')).toContain('left: 1px')
    const stage = readFileSync('src/presentation-kit/Stage.tsx', 'utf8')
    expect(stage).toContain('<LayoutGroup><AnimatePresence')
    expect(stage).toContain('exit={{ opacity: 0 }}')
  })
  it('I-5 delays only newcomers until continuing layout settles and supplies exit', () => {
    const { container, rerender } = render(<><Box id="old">old</Box><Appear><Box id="new">new</Box></Appear></>)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    const continuing = container.querySelector('[data-presentation-entity="old"]')!
    expect(JSON.parse(continuing.getAttribute('data-motion')!).initial).toBeUndefined()
    const appearing = container.querySelector('[data-presentation-appear]')!
    const config = JSON.parse(appearing.getAttribute('data-motion')!)
    expect(config.animate.transition.delay).toBe(ENTER_DELAY)
    expect(config.exit.opacity).toBe(0)
    rerender(<><Box id="old">updated</Box><Appear><Box id="new">new</Box></Appear></>)
    expect(container.querySelector('[data-presentation-entity="old"]')).toBe(continuing)
  })
  it('I-6 preserves grouped mounts and state but replaces changed groups or Scene', () => {
    let mounts = 0
    function Persistent({ payload }: SceneProps<number>) { const [identity] = useState(() => ++mounts); useEffect(() => {}, []); return <div data-instance={identity}>{payload}</div> }
    const grouped = steps.map(step => ({ ...step, Scene: Persistent }))
    const { container, rerender } = render(<Presentation title="Example" steps={grouped} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(mounts).toBe(1)
    expect(container.querySelector('[data-instance]')?.textContent).toBe('1')
    rerender(<Presentation title="Example" steps={grouped.map(step => ({ ...step, groupKey: 'other' }))} />)
    expect(mounts).toBe(2)
    function Other({ payload }: SceneProps<number>) { return <div data-other="">{payload}</div> }
    rerender(<Presentation title="Example" steps={grouped.map(step => ({ ...step, Scene: Other, groupKey: 'other' }))} />)
    expect(container.querySelector('[data-instance]')).toBeNull()
    expect(container.querySelector('[data-other]')?.textContent).toBe('1')
  })
  it('I-7 and I-8 preserve authored stacking and expose primitive hooks without visual defaults', () => {
    const primitives = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
    const { container } = render(<SceneLayer style={{ zIndex: 4 }}>{primitives.map((Node, n) => <Node key={n} id={`e${n}`} className="authored" data-author="yes" style={{ position: 'absolute', left: 50, top: 50, zIndex: n }}>value</Node>)}</SceneLayer>)
    const layer = container.querySelector('[data-presentation-layer]') as HTMLElement
    expect(layer.style.position).toBe('absolute'); expect(layer.style.inset).toBe('0px'); expect(layer.style.zIndex).toBe('4')
    container.querySelectorAll<HTMLElement>('[data-presentation-node]').forEach((node, n) => {
      expect(node.className).toBe('authored'); expect(node.dataset.author).toBe('yes'); expect(node.style.left).toBe('50px'); expect(node.style.zIndex).toBe(String(n))
      expect(JSON.parse(node.getAttribute('data-motion')!).layoutId).toBe(`e${n}`)
      expect(node.style.color).toBe(''); expect(node.style.border).toBe(''); expect(node.style.fontFamily).toBe('')
    })
  })
})

describe('chrome and modes', () => {
  it('I-10 shows linked attribution hook at bottom right and only opt-in branding', () => {
    const { container, rerender, getByText } = render(<Presentation title="Example" steps={steps} />)
    const link = getByText('made by and-scene') as HTMLAnchorElement
    expect(link.href).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.parentElement?.style.bottom).toBe('8px'); expect(link.parentElement?.style.right).toBe('16px')
    expect(container.querySelector('[data-presentation-brand]')).toBeNull()
    rerender(<Presentation title="Example" steps={steps} brand={<a href="/">My brand</a>} />)
    expect(container.querySelector('[data-presentation-brand]')?.textContent).toBe('My brand')
  })
  it('I-11 present mode is title-focused', () => {
    wide()
    const { container, getByText } = render(<Presentation title="Example" steps={steps} initialMode="present" />)
    expect(getByText('Title 0')).toBeTruthy()
    expect(container.querySelector('[data-presentation-marker]')).toBeTruthy()
    for (const hook of ['caption', 'toc', 'prev', 'next', 'progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeNull()
  })
  it('I-12 browse mode includes reading chrome and responsive ToC', () => {
    wide()
    const { container } = render(<Presentation title="Example" steps={steps} />)
    for (const hook of ['title', 'caption', 'toc', 'prev', 'next', 'progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeTruthy()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 })
    act(() => window.dispatchEvent(new Event('resize')))
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(container.querySelector('[data-presentation-caption]')).toBeTruthy()
  })
  it('I-13 honors both initial modes and toggles repeatedly without moving position', () => {
    const { container, getByRole } = render(<Presentation title="Example" steps={steps} initialMode="browse" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'p' })
    expect(host(container).getAttribute('data-presentation-mode')).toBe('present')
    expect(host(container).getAttribute('data-step-index')).toBe('1')
    fireEvent.click(getByRole('button', { name: 'Toggle presentation mode' }))
    expect(host(container).getAttribute('data-presentation-mode')).toBe('browse')
    expect(host(container).getAttribute('data-step-index')).toBe('1')
  })
  it('I-15 and I-16 direct jumps and current-state hooks follow active step and era', () => {
    wide()
    const { container, getByRole } = render(<Presentation title="Example" steps={steps} />)
    fireEvent.click(getByRole('button', { name: 'Step 3: Title 2' }))
    expect(host(container).getAttribute('data-step-index')).toBe('2')
    expect(getByRole('button', { name: 'build' }).getAttribute('aria-current')).toBe('step')
    expect(getByRole('button', { name: 'Step 3: Title 2' }).getAttribute('data-active')).toBe('true')
    expect(getByRole('button', { name: 'Step 1: Title 0' }).getAttribute('aria-current')).toBeNull()
    fireEvent.click(getByRole('button', { name: 'ask' }))
    expect(host(container).getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(getByRole('button', { name: 'Step 2: Title 1' }).getAttribute('aria-current')).toBe('step')
    expect(getByRole('button', { name: 'ask' }).getAttribute('data-active')).toBe('true')
  })
})

describe('navigation and geometry', () => {
  it('I-14 maps every keyboard action once and horizontal swipes by direction', () => {
    const { result } = renderHook(() => usePresentationNav(8))
    for (const [n, key] of ['ArrowRight', ' ', 'PageDown'].entries()) { act(() => { fireEvent.keyDown(window, { key }) }); expect(result.current.index).toBe(n + 1) }
    for (const [n, key] of ['ArrowLeft', 'PageUp'].entries()) { act(() => { fireEvent.keyDown(window, { key }) }); expect(result.current.index).toBe(2 - n) }
    const { container } = render(<Presentation title="Example" steps={steps} />)
    const target = host(container)
    fireEvent.touchStart(target, { touches: [{ clientX: 150, clientY: 50 }] }); fireEvent.touchEnd(target, { changedTouches: [{ clientX: 50, clientY: 55 }] })
    expect(target.getAttribute('data-step-index')).toBe('1')
    fireEvent.touchStart(target, { touches: [{ clientX: 50, clientY: 50 }] }); fireEvent.touchEnd(target, { changedTouches: [{ clientX: 150, clientY: 55 }] })
    expect(target.getAttribute('data-step-index')).toBe('0')
    fireEvent.touchStart(target, { touches: [{ clientX: 50, clientY: 50 }] }); fireEvent.touchEnd(target, { changedTouches: [{ clientX: 20, clientY: 180 }] })
    expect(target.getAttribute('data-step-index')).toBe('0')
  })
  it('I-17 keeps keys on interactive and editable controls without preventing default', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    for (const tag of ['button', 'a', 'input', 'textarea', 'select', 'div', 'tab', 'menuitem', 'radio', 'switch', 'listbox']) {
      const target = document.createElement(['tab', 'menuitem', 'radio', 'switch', 'listbox'].includes(tag) ? 'div' : tag)
      if (['tab', 'menuitem', 'radio', 'switch', 'listbox'].includes(tag)) target.setAttribute('role', tag)
      if (tag === 'div') target.setAttribute('contenteditable', 'true')
      document.body.appendChild(target)
      for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
        act(() => target.dispatchEvent(event))
        expect(result.current.index).toBe(0); expect(result.current.mode).toBe('browse'); expect(event.defaultPrevented).toBe(false)
      }
      target.remove()
    }
  })
  it('I-18 clamps repeated navigation at both ends including a single step', () => {
    const { result, rerender } = renderHook(({ count }) => usePresentationNav(count), { initialProps: { count: 3 } })
    act(() => { result.current.prev(); result.current.prev() }); expect(result.current.index).toBe(0)
    act(() => { for (let n = 0; n < 8; n++) result.current.next() }); expect(result.current.index).toBe(2)
    act(() => result.current.jump(-5)); expect(result.current.index).toBe(0)
    act(() => result.current.jump(99)); expect(result.current.index).toBe(2)
    rerender({ count: 1 }); act(() => { result.current.prev(); result.current.next() }); expect(result.current.index).toBe(0)
  })
  it('I-19 uniformly fits wide narrow and short viewports in both modes', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) for (const [w, h] of [[1440, 900], [390, 844], [900, 300]]) {
      const fit = fitGeometry(w, h, mode)
      expect(fit.scale * DESIGN_W).toBeLessThanOrEqual(fit.width)
      expect(fit.scale * DESIGN_H).toBeLessThanOrEqual(fit.height)
      expect(fit.scale).toBeGreaterThanOrEqual(0)
    }
    expect(fitGeometry(1400, 900, 'browse').left).toBeGreaterThan(fitGeometry(1400, 900, 'present').left)
    const { container } = render(<Presentation title="Example" steps={steps} />)
    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    const transform = canvas.style.transform
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(canvas.style.transform).toBe(transform)
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
  })
})
