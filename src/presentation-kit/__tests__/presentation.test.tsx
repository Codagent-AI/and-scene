// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation'
import type { Step } from '../types'
import { getFitScale } from '../useFitScale'
import { Arrow } from '../nodes/Arrow'

afterEach(cleanup)

type Payload = { value: string }
const Scene = ({ payload }: { payload: Payload }) => <div>{payload.value}</div>
const steps: Step<Payload>[] = [
  { id: 'one', era: 'start', title: 'First', caption: 'First caption', groupKey: 'same', Scene, payload: { value: 'one' } },
  { id: 'two', era: 'middle', title: 'Second', caption: 'Second caption', groupKey: 'same', Scene, payload: { value: 'two' } },
]

describe('Presentation runtime', () => {
  it('accepts typed grouped payloads and exposes ordered position hooks', () => {
    render(<Presentation steps={steps} title="Typed" initialMode="browse" />)
    expect(screen.getByText('one')).toBeTruthy()
    expect(document.querySelector('[data-step-count="2"][data-step-index="0"]')).toBeTruthy()
  })

  it('provides active progress semantics, direct navigation, keyboard clamping, and mode toggle', () => {
    render(<Presentation steps={steps} title="Typed" initialMode="browse" />)
    const current = screen.getByRole('button', { name: /first/i })
    expect(current.getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button', { name: /second/i }))
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.queryByText('Second caption')).toBeNull()
    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.getByText('Second caption')).toBeTruthy()
  })

  it('renders the default attribution and no default brand link', () => {
    render(<Presentation steps={steps} title="Typed" />)
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    expect(attribution.getAttribute('href')).toContain('github.com')
    expect(attribution.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(screen.queryByRole('link', { name: 'and-scene' })).toBeNull()
  })

  it('keeps the kit stylesheet structural and free of visual styling defaults', () => {
    const kitCss = readFileSync('src/presentation-kit/layout.css', 'utf8')
    expect(kitCss).not.toMatch(/(?:^|[;{])\s*(?:color|background(?:-color)?|font(?:-family|-size|-weight)?|border(?:-color|-style|-width)?|box-shadow|gap|padding|margin)\s*:/m)
  })

  it('renders the arrow glyph that matches its declared direction', () => {
    const { container } = render(<Arrow id="upstream" direction="up" />)
    expect(container.querySelector('[data-direction="up"]')?.textContent).toBe('↑')
  })

  it('keeps the visible table of contents above the mounted scene stage', () => {
    render(<Presentation steps={steps} title="Typed" initialMode="browse" />)
    const kitCss = readFileSync('src/presentation-kit/layout.css', 'utf8')
    const toc = document.querySelector('.presentation-toc')
    expect(toc).toBeTruthy()
    expect(kitCss).toMatch(/\.presentation-toc\s*\{[^}]*z-index:\s*1/m)
    fireEvent.click(screen.getByRole('button', { name: 'middle' }))
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  })

  it('keeps controls in charge of focused navigation keys', () => {
    render(<Presentation steps={steps} title="Typed" initialMode="browse" />)
    const button = screen.getByRole('button', { name: /second/i })
    button.focus()
    fireEvent.keyDown(button, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  })

  it('keeps the same grouped scene instance while its typed payload changes', () => {
    let mounts = 0
    function PersistentScene({ payload }: { payload: Payload }) {
      const [instance] = useState(() => ++mounts)
      return <div>{payload.value}:{instance}</div>
    }
    const grouped: Step<Payload>[] = steps.map((step) => ({ ...step, Scene: PersistentScene }))
    render(<Presentation steps={grouped} title="Typed" initialMode="browse" />)
    expect(screen.getByText('one:1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /second/i }))
    expect(screen.getByText('two:1')).toBeTruthy()
    expect(mounts).toBe(1)
  })

  it('fits the 880 by 380 canvas uniformly for both modes', () => {
    expect(getFitScale(440, 700, 'browse')).toBe(0.5)
    expect(getFitScale(880, 600, 'present')).toBe(1)
    expect(getFitScale(320, 240, 'browse')).toBeLessThanOrEqual(4 / 380)
  })
})
