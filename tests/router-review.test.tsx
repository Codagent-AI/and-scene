import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Router } from '../src/Router'

vi.mock('../src/presentations', async () => {
  const { Presentation } = await import('../src/presentation-kit')
  return { presentations: [
    { slug: 'broken', title: 'Broken import', load: () => Promise.reject(new Error('stale presentation chunk')) },
    { slug: 'empty', title: 'Empty presentation', load: async () => ({ default: () => <Presentation title="Empty" steps={[]} /> }) },
    { slug: 'healthy', title: 'Healthy presentation', load: async () => ({ default: () => <p>Healthy presentation content</p> }) },
  ] }
})
beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => vi.restoreAllMocks())
describe('R3 route error recovery', () => {
  it('R3 rejected lazy imports show a recovery message and landing link', async () => {
    render(<Router pathname="/broken" />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Unable to load this presentation' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to presentations' }).getAttribute('href')).toBe('/')
    expect(console.error).toHaveBeenCalled()
  })
  it('R3 actual empty-step kit errors show recovery instead of a blank tree', async () => {
    render(<Router pathname="/empty" />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to presentations' }).getAttribute('href')).toBe('/')
    expect(console.error).toHaveBeenCalled()
  })
  it('R3 changing to another presentation resets the failed boundary', async () => {
    const view = render(<Router pathname="/broken" />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    view.rerender(<Router pathname="/healthy" />)
    expect(await screen.findByText('Healthy presentation content')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
