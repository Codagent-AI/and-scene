// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Router } from '../src/Router'
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  disconnect() {}
})
afterEach(cleanup)
it('lists explicit registered routes on the landing and unknown paths', () => {
  render(<Router pathname="/unknown" />)
  expect(screen.getByRole('link', { name: /How to Use This Skill/ }).getAttribute('href')).toBe('/how-to-make-a-presentation')
})
it('loads the registered presentation by pathname', async () => {
  render(<Router pathname="/how-to-make-a-presentation/" />)
  expect(await screen.findByRole('heading', { name: 'You have a topic' })).toBeTruthy()
})
