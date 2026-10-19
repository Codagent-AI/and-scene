import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

let mounts = 0

function Counted({ payload }: SceneProps<string>) {
  useEffect(() => {
    mounts += 1
  }, [])
  return <div data-testid="scene">{payload}</div>
}

const ERAS = ['Setup', 'Setup', 'Build', 'Build', 'Build', 'Ship']

const steps: Step<string>[] = ERAS.map((era, i) => ({
  id: `s${i}`,
  era,
  title: `Title ${i}`,
  caption: `Caption ${i} paragraph.`,
  groupKey: 'g',
  Scene: Counted,
  payload: `payload-${i}`,
}))

function setViewport(width: number, height = 900) {
  window.innerWidth = width
  window.innerHeight = height
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

function root(): HTMLElement {
  return document.querySelector('[data-presentation-root]') as HTMLElement
}

function scene(): HTMLElement {
  return document.querySelector('[data-testid="scene"]') as HTMLElement
}

function toggleButton(): HTMLButtonElement {
  return document.querySelector('[data-presentation-mode-toggle]') as HTMLButtonElement
}

beforeEach(() => {
  mounts = 0
})

afterEach(() => {
  cleanup()
})

describe('L-11: present and browse mode chrome', () => {
  it('L-11: present mode shows the marker and one-line title, and hides caption, ToC, and prev/next', () => {
    setViewport(1280)
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(root().dataset.presentationMode).toBe('present')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('1')
    const titles = document.querySelectorAll('[data-presentation-title]')
    expect(titles).toHaveLength(1)
    expect(titles[0].tagName).toBe('P')
    expect(titles[0].textContent).toBe('Title 0')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.body.textContent).not.toContain('Caption 0 paragraph.')
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
    expect(document.querySelector('[data-presentation-next]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).toBeNull()
    expect(scene().textContent).toBe('payload-0')
    expect(toggleButton().textContent).toBe('Browse')
  })

  it('L-11: browse mode shows the title, multi-line caption, prev/next, progress, and the wide ToC', () => {
    setViewport(1280)
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(root().dataset.presentationMode).toBe('browse')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('1')
    const title = document.querySelector('header [data-presentation-title]') as HTMLElement
    expect(title.tagName).toBe('H1')
    expect(title.textContent).toBe('Title 0')
    const caption = document.querySelector('[data-presentation-caption]') as HTMLElement
    expect(caption.tagName).toBe('P')
    expect(caption.textContent).toBe('Caption 0 paragraph.')
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(6)
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-toc-item]')).toHaveLength(3)
    expect(toggleButton().textContent).toBe('Present')
  })

  it('L-11: the ToC is absent at 1023 px and present at 1024 px in browse, with a runtime resize', () => {
    setViewport(1023)
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    setViewport(1024)
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    setViewport(1023)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })

  it('L-11: the ToC is never shown in present mode, at 1024 px or 1280 px', () => {
    setViewport(1024)
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    setViewport(1280)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })
})

describe('L-12: initialMode and runtime mode toggles preserve position', () => {
  it.each(['present', 'browse'] as const)('L-12: opens in initialMode %s', (initialMode) => {
    setViewport(1280)
    render(<Presentation steps={steps} title="Deck" initialMode={initialMode} />)
    expect(root().dataset.presentationMode).toBe(initialMode)
  })

  it.each(['present', 'browse'] as const)(
    'L-12: from initialMode %s, P and the on-screen toggle switch both ways while keeping the step and scene node',
    (initialMode) => {
      setViewport(1280)
      render(<Presentation steps={steps} title="Deck" initialMode={initialMode} />)
      fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      expect(root().dataset.stepIndex).toBe('2')
      const node = scene()
      const mountsBefore = mounts
      const other = initialMode === 'present' ? 'browse' : 'present'

      fireEvent.keyDown(document.body, { key: 'p' })
      expect(root().dataset.presentationMode).toBe(other)
      expect(root().dataset.presentationStepIndex).toBe('2')
      expect(scene().textContent).toBe('payload-2')
      expect(scene()).toBe(node)

      fireEvent.click(toggleButton())
      expect(root().dataset.presentationMode).toBe(initialMode)
      expect(root().dataset.presentationStepIndex).toBe('2')
      expect(scene().textContent).toBe('payload-2')
      expect(scene()).toBe(node)

      fireEvent.keyDown(document.body, { key: 'P' })
      expect(root().dataset.presentationMode).toBe(other)
      fireEvent.click(toggleButton())
      expect(root().dataset.presentationMode).toBe(initialMode)

      expect(mounts).toBe(mountsBefore)
    },
  )

  it('L-12: toggling into browse at 1280 px shows the ToC at the current step without remounting the scene', () => {
    setViewport(1280)
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    for (let i = 0; i < 4; i++) fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(root().dataset.stepIndex).toBe('4')
    const node = scene()
    const mountsBefore = mounts
    fireEvent.click(toggleButton())
    const active = document.querySelector('[data-presentation-toc-item][data-presentation-active="true"]')
    expect(active?.textContent).toBe('Build')
    expect(scene()).toBe(node)
    expect(scene().textContent).toBe('payload-4')
    expect(mounts).toBe(mountsBefore)
  })
})
