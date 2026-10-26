import { render, screen } from '@testing-library/react'
import { lazy } from 'react'
import { describe, expect, it } from 'vitest'
import { AppRouter } from './router'
import type { PresentationRegistration } from './presentations'
import { routeForPathname } from './routing'

function RegisteredPresentation() {
  return <h1>Registered presentation</h1>
}

const presentations: readonly PresentationRegistration[] = [
  {
    slug: 'example',
    title: 'Example presentation',
    load: async () => ({ default: RegisteredPresentation }),
  },
]

describe('pathname presentation router', () => {
  it('resolves the landing page for root and unknown paths', () => {
    expect(routeForPathname('/', presentations)).toBeNull()
    expect(routeForPathname('/missing', presentations)).toBeNull()
  })

  it('renders the registered presentation route through its explicit registry entry', async () => {
    render(
      <AppRouter
        pathname="/example"
        presentations={presentations}
        components={new Map([['example', lazy(presentations[0]!.load)]])}
      />,
    )

    expect(await screen.findByRole('heading', { name: 'Registered presentation' })).toBeInTheDocument()
  })
})
