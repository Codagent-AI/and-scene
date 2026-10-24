import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { PresentationMode, SceneProps, Step } from './types'

interface Payload {
  label: string
}

let mounts = 0
function GroupedScene({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    mounts++
  }, [])
  return <div data-testid="scene">{payload.label}</div>
}
function OtherScene({ payload }: SceneProps<Payload>) {
  return <div data-testid="scene">{payload.label}</div>
}

const ERAS = ['one', 'one', 'two', 'two', 'three']
function makeSteps(): Step<Payload>[] {
  return ERAS.map((era, i) => ({
    id: `s${i}`,
    era,
    title: `Title ${i}`,
    caption: `Caption ${i}`,
    // First three steps share a group; the rest are standalone scenes.
    Scene: i < 3 ? GroupedScene : OtherScene,
    payload: { label: `payload-${i}` },
    groupKey: i < 3 ? 'g' : undefined,
  }))
}

function setViewport(width: number, height = 800) {
  Object.assign(window, { innerWidth: width, innerHeight: height })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

const root = () => document.querySelector('[data-presentation-root]')!
const q = (sel: string) => document.querySelector(sel)

function mount(mode?: PresentationMode, steps = makeSteps()) {
  setViewport(1400)
  return render(<Presentation steps={steps} title="Deck" initialMode={mode} />)
}

describe('Presentation chrome', () => {
  it('exposes the step count and index hooks', () => {
    mount('browse')
    expect(root().getAttribute('data-step-count')).toBe('5')
    expect(root().getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(root().getAttribute('data-step-index')).toBe('1')
  })

  it('present mode shows marker and title only', () => {
    mount('present')
    expect(q('[data-presentation-marker]')!.textContent).toBe('01 / 05')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 0')
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-prev]')).toBeNull()
    expect(q('[data-presentation-next]')).toBeNull()
    expect(q('[data-presentation-progress]')).toBeNull()
  })

  it('browse mode shows title, caption, toc, controls and progress', () => {
    mount('browse')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 0')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption 0')
    expect(q('[data-presentation-toc]')).not.toBeNull()
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(5)
  })

  it('hides the table of contents on a narrow viewport', () => {
    setViewport(600)
    render(<Presentation steps={makeSteps()} initialMode="browse" />)
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-progress]')).not.toBeNull()
  })

  it('shows a caption for every step and navigates with next/previous', () => {
    mount('browse')
    const next = q('[data-presentation-next]') as HTMLButtonElement
    const prev = q('[data-presentation-prev]') as HTMLButtonElement
    for (let i = 0; i < 5; i++) {
      expect(q('[data-presentation-caption]')!.textContent).toBe(`Caption ${i}`)
      if (i < 4) fireEvent.click(next)
    }
    expect(next.disabled).toBe(true)
    fireEvent.click(prev)
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption 3')
  })

  it('toggling mode keeps the current step', () => {
    mount('browse')
    fireEvent.click(q('[data-presentation-progress-item]:nth-child(3)')!)
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(root().getAttribute('data-step-index')).toBe('2')
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(root().getAttribute('data-step-index')).toBe('2')
  })

  it('progress indicators and toc entries jump directly', () => {
    mount('browse')
    fireEvent.click(q('[data-presentation-progress-item]:nth-child(4)')!)
    expect(root().getAttribute('data-step-index')).toBe('3')
    // The "three" era starts at step index 4; "two" starts at index 2.
    const items = [...document.querySelectorAll('[data-presentation-toc-item]')]
    expect(items.map((i) => i.textContent)).toEqual(['one', 'two', 'three'])
    fireEvent.click(items[2])
    expect(root().getAttribute('data-step-index')).toBe('4')
    fireEvent.click(items[1])
    expect(root().getAttribute('data-step-index')).toBe('2')
    fireEvent.click(items[0])
    expect(root().getAttribute('data-step-index')).toBe('0')
  })

  it('marks the active progress indicator and toc entry', () => {
    mount('browse')
    fireEvent.click(q('[data-presentation-progress-item]:nth-child(4)')!)
    const progress = [...document.querySelectorAll('[data-presentation-progress-item]')]
    expect(progress.map((p) => p.getAttribute('aria-current'))).toEqual([null, null, null, 'step', null])
    expect(progress.map((p) => p.getAttribute('data-presentation-active'))).toEqual([
      'false', 'false', 'false', 'true', 'false',
    ])
    const toc = [...document.querySelectorAll('[data-presentation-toc-item]')]
    expect(toc.map((t) => t.getAttribute('aria-current'))).toEqual([null, 'step', null])
    expect(toc.map((t) => t.getAttribute('data-presentation-active'))).toEqual(['false', 'true', 'false'])
  })

  it('derives step numbers from order, not from step data', () => {
    const steps = makeSteps()
    const { rerender } = render(<Presentation steps={steps} initialMode="present" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 1')
    expect(q('[data-presentation-marker]')!.textContent).toBe('02 / 05')
    // Remove the first step and reorder: numbering follows position.
    const reordered = [steps[3], steps[1], steps[2]]
    rerender(<Presentation steps={reordered} initialMode="present" />)
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 1')
    expect(q('[data-presentation-marker]')!.textContent).toBe('02 / 03')
  })

  it('is controlled by keyboard focus rules: a focused control keeps its keys', () => {
    mount('browse')
    const next = q('[data-presentation-next]') as HTMLButtonElement
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(root().getAttribute('data-step-index')).toBe('0')
  })
})

describe('attribution and branding', () => {
  it('shows the default bottom-right attribution with a styling hook', () => {
    mount('browse')
    const a = q('[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('made by and-scene')
    expect(a.href).toBe('https://github.com/Codagent-AI/and-scene')
    expect(a.style.right).toBe('0px')
    expect(a.style.bottom).toBe('0px')
  })

  it('can override or hide the attribution', () => {
    const { unmount } = render(
      <Presentation steps={makeSteps()} attribution={{ label: 'custom', href: 'https://example.com/x' }} />,
    )
    const a = q('[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('custom')
    expect(a.href).toBe('https://example.com/x')
    unmount()
    render(<Presentation steps={makeSteps()} attribution={false} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default brand link in the top-left slot', () => {
    mount('browse')
    const slot = q('[data-presentation-brand-slot]') as HTMLElement
    expect(slot.childElementCount).toBe(0)
    expect(within(q('[data-presentation-header]') as HTMLElement).queryByRole('link')).toBeNull()
  })

  it('renders a host-provided brand in the slot', () => {
    setViewport(1400)
    render(<Presentation steps={makeSteps()} brand={<a href="/">home</a>} />)
    expect(within(q('[data-presentation-brand-slot]') as HTMLElement).getByText('home')).toBeTruthy()
  })
})

describe('grouped scenes', () => {
  it('updates a grouped scene in place instead of remounting', () => {
    mounts = 0
    mount('present')
    expect(screen.getByTestId('scene').textContent).toBe('payload-0')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('scene').textContent).toBe('payload-1')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('scene').textContent).toBe('payload-2')
    expect(mounts).toBe(1)
  })

  it('mounts a different scene when leaving the group', () => {
    mounts = 0
    mount('present')
    for (let i = 0; i < 3; i++) fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getAllByTestId('scene').some((n) => n.textContent === 'payload-3')).toBe(true)
  })

  it('accepts a strongly typed payload array without casts', () => {
    // Compile-time contract: `Step<Payload>[]` flows into <Presentation> as is.
    const typed: Step<Payload>[] = makeSteps()
    render(<Presentation steps={typed} />)
    expect(root()).not.toBeNull()
  })
})
