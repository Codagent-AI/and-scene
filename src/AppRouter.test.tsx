import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppRouter } from './AppRouter'
import type { PresentationRegistryEntry } from './presentations'

function StubPresentation() {
  return <div>Stub presentation content</div>
}

const entries: PresentationRegistryEntry[] = [
  { slug: 'stub-talk', title: 'Stub Talk', load: () => Promise.resolve({ default: StubPresentation }) },
]

describe('AppRouter', () => {
  it('renders the landing page at "/"', () => {
    render(<AppRouter pathname="/" entries={entries} />)
    expect(screen.getByText('and-scene')).toBeInTheDocument()
  })

  it('lazily renders a registered presentation for its slug', async () => {
    render(<AppRouter pathname="/stub-talk" entries={entries} />)
    expect(await screen.findByText('Stub presentation content')).toBeInTheDocument()
  })

  it('renders a not-found view with a link home for an unregistered slug', () => {
    render(<AppRouter pathname="/nope" entries={entries} />)
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /and-scene|home/i })).toHaveAttribute('href', '/')
  })
})
