import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { resolveRoute } from '../src/routes'
import Landing from '../src/Landing'
import type { PresentationEntry } from '../src/presentations'
import { presentations } from '../src/presentations'

const registry: PresentationEntry[] = [
  { slug: 'demo', title: 'Demo Talk', load: async () => ({ default: () => null }) },
]

describe('route resolution', () => {
  it('resolves / to landing', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
  })
  it('resolves a registered slug', () => {
    const r = resolveRoute('/demo', registry)
    expect(r.kind === 'presentation' && r.entry.slug).toBe('demo')
    expect(resolveRoute('/demo/', registry).kind).toBe('presentation')
  })
  it('falls back to landing for unknown paths', () => {
    expect(resolveRoute('/nope', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/%E0%A4%A', registry)).toEqual({ kind: 'landing' })
  })
  it('registry entries are explicit and lazy', () => {
    for (const p of presentations) expect(typeof p.load).toBe('function')
  })
})

describe('Landing', () => {
  it('links to each registry entry', () => {
    render(<Landing registry={registry} />)
    expect(screen.getByRole('link', { name: 'Demo Talk' }).getAttribute('href')).toBe('/demo')
  })
})
