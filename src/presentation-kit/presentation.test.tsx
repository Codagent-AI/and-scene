// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from './Presentation'
import { Box } from './nodes/Box'
import type { PresentationProps, SceneProps, Step } from './types'
import { presentations } from '../presentations'
import { resolvePresentationRoute } from '../router'

interface Payload { value: number }
const mountSpy = vi.fn()
const unmountSpy = vi.fn()
function SharedScene({ payload }: SceneProps<Payload>) {
  useEffect(() => { mountSpy(); return () => { unmountSpy() } }, [])
  return <div data-testid="payload">{payload.value}</div>
}
function RouteComponent() { return null }
const steps: readonly Step<Payload>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', groupKey: 'same-scene', payload: { value: 1 }, Scene: SharedScene },
  { id: 'two', era: 'Middle', title: 'Second', caption: 'Second caption', groupKey: 'same-scene', payload: { value: 2 }, Scene: SharedScene },
  { id: 'three', era: 'Middle', title: 'Third', caption: 'Third caption', groupKey: 'same-scene', payload: { value: 3 }, Scene: SharedScene },
]

afterEach(() => cleanup())

describe('presentation kit contract', () => {
  it('preserves strongly typed payloads through the Presentation boundary and updates grouped scenes in place', () => {
    const props: PresentationProps<Payload> = { title: 'Typed presentation', steps }
    mountSpy.mockClear(); unmountSpy.mockClear()
    render(<Presentation {...props} />)
    expect(screen.getByTestId('payload').textContent).toBe('1')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('payload').textContent).toBe('2')
    expect(mountSpy).toHaveBeenCalledTimes(1)
    expect(unmountSpy).not.toHaveBeenCalled()
  })

  it('keeps kit primitives free of visual defaults', () => {
    const { container } = render(<Box entityId="stable-box">Plain content</Box>)
    const box = container.querySelector('[data-presentation-node="box"]')
    expect(box).toBeTruthy()
    expect(box?.getAttribute('style') ?? '').not.toMatch(/color|background|border|box-shadow|font-family/i)
    expect(box?.className).toContain('scene-box')
  })

  it('renders the default attribution hook and GitHub link without top-left branding', () => {
    const { container } = render(<Presentation title="Example" steps={steps} />)
    const attribution = container.querySelector('[data-presentation-attribution]')
    expect(attribution?.textContent).toBe('made by and-scene')
    expect(attribution?.getAttribute('href')).toContain('github.com/and-scene')
    expect(container.querySelector('.presentation-header a')).toBeNull()
  })

  it('exposes active progress and section semantics and clamps at both ends', () => {
    render(<Presentation title="Example" steps={steps} />)
    expect(screen.getByRole('button', { name: '1: First' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: 'Start' }).getAttribute('aria-current')).toBe('location')
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: '3: Third' }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
  })

  it('switches modes without moving steps and keeps deck keys working after chrome focus', () => {
    render(<Presentation title="Example" steps={steps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
    fireEvent.keyDown(next, { key: 'p' })
    expect(document.querySelector('[data-presentation]')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
    expect(screen.queryByRole('navigation', { name: 'Presentation steps' })).toBeNull()
  })

  it('ignores presentation navigation shortcuts with modifiers', () => {
    render(<Presentation title="Example" steps={steps} />)
    fireEvent.keyDown(window, { key: 'p', ctrlKey: true })
    fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true })
    expect(document.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('browse')
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('provides an explicit empty registry and resolves only registered path slugs', () => {
    expect(presentations.map(({ slug, title }) => ({ slug, title }))).toEqual([{ slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation' }])
    const entry = { slug: 'example', title: 'Example', load: async () => ({ default: RouteComponent }) }
    expect(resolvePresentationRoute('/', [entry])).toBeUndefined()
    expect(resolvePresentationRoute('/example/', [entry])).toBe(entry)
    expect(resolvePresentationRoute('/missing', [entry])).toBeUndefined()
  })
})
