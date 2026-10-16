import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Router } from './Router'
import type { PresentationEntry } from './presentations'

const reg: PresentationEntry[] = [
  { slug: 'talk', title: 'A Talk', load: async () => ({ default: () => <p>talk body</p> }) },
]

describe('Router / Landing', () => {
  it('renders the landing page with a link per presentation', () => {
    render(<Router pathname="/" registry={reg} />)
    expect(screen.getByRole('link', { name: 'A Talk' }).getAttribute('href')).toBe('/talk')
  })
  it('renders an empty landing page for an empty registry', () => {
    render(<Router pathname="/" registry={[]} />)
    expect(screen.getByRole('heading', { name: 'and-scene' })).toBeTruthy()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
  it('lazy loads a known slug', async () => {
    render(<Router pathname="/talk" registry={reg} />)
    expect(await screen.findByText('talk body')).toBeTruthy()
  })
  it('falls back to landing for unknown paths', () => {
    render(<Router pathname="/missing" registry={reg} />)
    expect(screen.getByRole('link', { name: 'A Talk' })).toBeTruthy()
  })
})
