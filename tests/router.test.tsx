import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Router } from '../src/Router'
const loaders = vi.hoisted(() => ({
  alpha: vi.fn(async () => ({ default: () => <h1>Alpha scene</h1> })),
  beta: vi.fn(async () => ({ default: () => <h1>Beta scene</h1> })),
}))
vi.mock('../src/presentations', () => ({ presentations: [
  { slug: 'alpha', title: 'Alpha presentation', load: loaders.alpha },
  { slug: 'beta', title: 'Beta presentation', load: loaders.beta },
] }))

describe('I-25 registry routing and preservation', () => {
  it('lists every explicit registered presentation on the landing route', () => {
    render(<Router pathname="/" />)
    expect(screen.getByRole('link', { name: /Alpha presentation/ }).getAttribute('href')).toBe('/alpha')
    expect(screen.getByRole('link', { name: /Beta presentation/ }).getAttribute('href')).toBe('/beta')
    expect(loaders.alpha).not.toHaveBeenCalled()
    expect(loaders.beta).not.toHaveBeenCalled()
  })
  it('lazily loads a known route without loading unrelated presentations', async () => {
    render(<Router pathname="/alpha" />)
    expect(await screen.findByRole('heading', { name: 'Alpha scene' })).not.toBeNull()
    expect(loaders.alpha).toHaveBeenCalledTimes(1)
    expect(loaders.beta).not.toHaveBeenCalled()
  })
  it('keeps a second presentation reachable and accepts a trailing slash', async () => {
    render(<Router pathname="/beta/" />)
    expect(await screen.findByRole('heading', { name: 'Beta scene' })).not.toBeNull()
    expect(loaders.beta).toHaveBeenCalledTimes(1)
  })
  it('falls back to the same registry landing for an unknown route', () => {
    render(<Router pathname="/missing" />)
    expect(screen.getByRole('link', { name: /Alpha presentation/ })).not.toBeNull()
    expect(screen.getByRole('link', { name: /Beta presentation/ })).not.toBeNull()
  })
})
