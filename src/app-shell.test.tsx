// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Landing } from './Landing.tsx'
import { resolvePresentation } from './router.ts'
import type { PresentationRegistryEntry } from './presentations/index.ts'

const entries: PresentationRegistryEntry[] = [
  { slug: 'first-talk', title: 'First Talk', load: async () => ({ default: () => null }) },
  { slug: 'second-talk', title: 'Second Talk', load: async () => ({ default: () => null }) },
]

describe('application shell', () => {
  afterEach(() => document.body.replaceChildren())

  it('enumerates registered presentations as routed links', () => {
    render(<Landing presentations={entries} />)

    expect(screen.getByRole('link', { name: 'First Talk' })).toHaveAttribute('href', '/first-talk')
    expect(screen.getByRole('link', { name: 'Second Talk' })).toHaveAttribute('href', '/second-talk')
  })

  it('resolves root, registered, and unknown paths without a router dependency', () => {
    expect(resolvePresentation('/')).toBe('landing')
    expect(resolvePresentation('/first-talk', entries)).toBe(entries[0])
    expect(resolvePresentation('/missing', entries)).toBe('landing')
  })
})
