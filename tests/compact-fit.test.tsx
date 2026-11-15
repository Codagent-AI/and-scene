import { afterEach, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { fitGeometry, fitScale } from '../src/presentation-kit/useFitScale'
import { Presentation } from '../src/presentation-kit/Presentation'
import type { Step } from '../src/presentation-kit/types'
const steps: Step[] = [{ id: 'one', era: 'start', title: 'Title', caption: 'Browse caption', payload: undefined, Scene: () => <div>diagram</div> }]
afterEach(() => { window.innerWidth = 1440; window.innerHeight = 900 })
it('R3 positive short viewports retain a positive uniform fit without overflowing canvas space', () => {
  for (const mode of ['browse', 'present'] as const) for (const [width, height] of [[844, 360], [390, 280], [1440, 240], [320, 120], [20, 20]]) {
    const geometry = fitGeometry(width, height, mode)
    const scale = fitScale(width, height, mode)
    expect(geometry.compact).toBe(true)
    expect(scale).toBeGreaterThan(0)
    expect(880 * scale).toBeLessThanOrEqual(width - geometry.layout.left - geometry.layout.right + 1e-8)
    expect(380 * scale).toBeLessThanOrEqual(geometry.availableHeight + 1e-8)
  }
  expect(fitScale(0, 0, 'browse')).toBe(0)
  expect(fitGeometry(1440, 900, 'browse').compact).toBe(false)
  expect(fitScale(844, 360, 'browse')).toBeGreaterThan(0.3)
})
it('R3 compact flow retains browse chrome and active position while resizing back to viewport layout', () => {
  window.innerWidth = 1440; window.innerHeight = 280
  render(<Presentation steps={steps} title="compact" />)
  const root = screen.getByRole('main')
  const stage = document.querySelector<HTMLElement>('[data-presentation-stage]')!
  const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!
  expect(root.dataset.presentationLayout).toBe('flow')
  expect(root.dataset.presentationMode).toBe('browse')
  expect(screen.getByText('Browse caption')).toBeTruthy()
  expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Next', exact: true })).toBeTruthy()
  expect(stage.style.position).toBe('relative')
  expect(parseFloat(stage.style.height)).toBeGreaterThan(0)
  expect((document.querySelector('[data-presentation-footer]') as HTMLElement).style.position).toBe('relative')
  expect((document.querySelector('[data-presentation-toc]') as HTMLElement).style.position).toBe('relative')
  expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
  expect(Number(canvas.style.transform.match(/scale\(([^)]+)\)/)?.[1])).toBeGreaterThan(0)
  const diagram = screen.getByText('diagram')
  act(() => { window.innerHeight = 900; window.dispatchEvent(new Event('resize')) })
  expect(root.dataset.presentationLayout).toBe('viewport')
  expect(root.dataset.stepIndex).toBe('0')
  expect(stage.style.position).toBe('absolute')
  expect(screen.getByText('diagram')).toBe(diagram)
})
it('R3 compact present mode keeps its title and marker without exposing browse controls', () => {
  window.innerWidth = 1440; window.innerHeight = 240
  render(<Presentation steps={steps} title="compact present" initialMode="present" />)
  expect(screen.getByRole('main').dataset.presentationMode).toBe('present')
  expect(screen.getByRole('main').dataset.presentationLayout).toBe('flow')
  expect(screen.getByRole('heading', { name: 'Title' })).toBeTruthy()
  expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
  for (const hook of ['caption', 'toc', 'navigation', 'progress']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
  expect(parseFloat((document.querySelector('[data-presentation-stage]') as HTMLElement).style.height)).toBeGreaterThan(0)
})
