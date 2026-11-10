// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
vi.mock('../src/presentations', () => ({ presentations: [{ slug: 'broken', title: 'Broken', load: () => Promise.reject(new Error('chunk unavailable')) }] }))
import { Router } from '../src/Router'
it('shows recovery guidance when a registered chunk cannot load', async () => {
  render(<Router pathname="/broken" />)
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Reload'))
  expect(screen.getByRole('link', { name: 'Back to presentations' }).getAttribute('href')).toBe('/')
})
