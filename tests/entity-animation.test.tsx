import { it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Box } from '../src/presentation-kit/nodes/primitives'
it('I-4 continuing entity animates label and author-owned emphasis through intermediate states', async () => {
  const view = render(<Box entityId="continuing" style={{ opacity: 1 }} emphasis={{ opacity: 1, scale: 1 }}>Old label</Box>)
  const entity = document.querySelector<HTMLElement>('[data-presentation-entity="continuing"]')!
  const oldLabel = document.querySelector<HTMLElement>('[data-presentation-label-active="true"]')!
  view.rerender(<Box entityId="continuing" style={{ opacity: 1 }} emphasis={{ opacity: 0.4, scale: 1.4 }}>New label</Box>)
  expect(document.querySelector('[data-presentation-entity="continuing"]')).toBe(entity)
  const newLabel = document.querySelector<HTMLElement>('[data-presentation-label-active="true"]')!
  expect(newLabel.textContent).toBe('New label')
  expect(oldLabel.getAttribute('aria-hidden')).toBe('true')
  expect(oldLabel.isConnected).toBe(true)
  await waitFor(() => {
    expect(Number(oldLabel.style.opacity)).toBeGreaterThan(0)
    expect(Number(oldLabel.style.opacity)).toBeLessThan(1)
    expect(Number(newLabel.style.opacity)).toBeGreaterThan(0)
    expect(Number(newLabel.style.opacity)).toBeLessThan(1)
    expect(Number(entity.style.opacity)).toBeGreaterThan(0.4)
    expect(Number(entity.style.opacity)).toBeLessThan(1)
  })
  await waitFor(() => {
    expect(oldLabel.isConnected).toBe(false)
    expect(entity.style.opacity).toBe('0.4')
    expect(entity.style.transform).toContain('scale(1.4)')
    expect(newLabel.style.opacity).toBe('1')
  }, { timeout: 2000 })
  expect(document.querySelector('[data-presentation-entity="continuing"]')).toBe(entity)
})
it('I-4 explicit labels animate alongside complex children without restarting unchanged labels', async () => {
  const view = render(<Box entityId="complex" label="Initial"><b>Decoration</b></Box>)
  const label = document.querySelector('[data-presentation-label-active="true"]')!
  const decoration = document.querySelector('b')
  view.rerender(<Box entityId="complex" label="Initial" emphasis={{ scale: 1.1 }}><b>Decoration</b></Box>)
  expect(document.querySelector('[data-presentation-label-active="true"]')).toBe(label)
  expect(document.querySelectorAll('[data-presentation-label-active]')).toHaveLength(1)
  view.rerender(<Box entityId="complex" label="Updated"><b>Decoration</b></Box>)
  expect(document.querySelector('[data-presentation-label-active="true"]')?.textContent).toBe('Updated')
  expect(document.querySelector('b')).toBe(decoration)
  await waitFor(() => expect(label.isConnected).toBe(false), { timeout: 2000 })
})
