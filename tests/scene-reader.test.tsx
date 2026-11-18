import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import Talk from '../src/presentations/how-to-make-a-presentation/Talk'

afterEach(() => { window.innerWidth = 1024 })
it('F-001 provides current labels at 14 CSS pixels outside the fitted canvas on narrow screens', () => {
  window.innerWidth = 390
  const { container } = render(<Talk />)
  const key = screen.getByRole('complementary', { name: 'Scene reading key for step 1' })
  expect(key.style.fontSize).toBe('14px')
  expect(key.getAttribute('data-presentation-capture-region')).toBe('reading-key')
  expect(key.getAttribute('data-presentation-capture-probes')).toBe('5,14;5,-14')
  expect(key.closest('[data-presentation-canvas]')).toBeNull()
  expect(key.querySelector('[data-sample-reader-entity="you"]')?.textContent).toBe('you')
  expect(key.querySelector('[data-sample-reader-entity="prompt"]')?.textContent).toBe('“I have a topic…”')
  expect(key.querySelector('[data-sample-reader-entity="card-1"]')).toBeNull()
  for (let i = 0; i < 4; i++) fireEvent.keyDown(window, { key: 'ArrowRight' })
  const dense = screen.getByRole('complementary', { name: 'Scene reading key for step 5' })
  expect(dense.querySelector('[data-sample-reader-entity="card-1"]')?.textContent).toContain('title, caption, visual')
  expect(dense.querySelector('[data-sample-reader-entity="depth"]')?.textContent).toBe('partial ⟷ full')
  const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
  expect(canvas.style.width).toBe('880px')
  expect(canvas.style.height).toBe('380px')
  expect(canvas.style.transform).toContain('scale(')
  fireEvent.keyDown(dense, { key: 'PageDown' })
  fireEvent.touchStart(dense, { touches: [{ clientX: 200, clientY: 20 }] })
  fireEvent.touchEnd(dense, { changedTouches: [{ clientX: 0, clientY: 20 }] })
  expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('4')
  act(() => { window.innerWidth = 1280; window.dispatchEvent(new Event('resize')) })
  expect(screen.queryByRole('complementary')).toBeNull()
})
