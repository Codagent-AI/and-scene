import { render, screen } from '@testing-library/react'
import { Router } from './Router'
import { definePresentation } from './presentations'
import type { RegisteredPresentation } from './presentations'

const presentations: readonly RegisteredPresentation[] = [
  definePresentation({
    slug: 'example',
    title: 'Example',
    load: async () => ({ default: () => <h1>Loaded presentation</h1> }),
  }),
]

test('renders a registered presentation for its pathname', async () => {
  render(<Router pathname="/example" presentations={presentations} />)

  expect(await screen.findByRole('heading', { name: 'Loaded presentation' })).toBeTruthy()
})

test('falls back to the landing page for unknown paths', () => {
  render(<Router pathname="/missing" presentations={presentations} />)

  expect(screen.getByRole('heading', { name: 'Presentations' })).toBeTruthy()
})
