import { it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
vi.mock('../src/presentations', () => ({ presentations: [
  { slug: 'first', title: 'First presentation', load: async () => ({ default: () => <div>First route content</div> }) },
  { slug: 'second', title: 'Second presentation', load: async () => ({ default: () => <div>Second route content</div> }) },
] }))
import { Router } from '../src/Router'
import { routeFor } from '../src/routes'
it('I-22 multiple presentations coexist, lazy load and appear in landing and fallback', async () => {
  const view = render(<Router path="/" />)
  expect(screen.getAllByRole('link')).toHaveLength(2)
  expect(routeFor('/first')?.slug).toBe('first'); expect(routeFor('/second/')?.slug).toBe('second')
  view.rerender(<Router path="/first" />); expect(await screen.findByText('First route content')).toBeInTheDocument()
  view.rerender(<Router path="/second" />); expect(await screen.findByText('Second route content')).toBeInTheDocument()
  view.rerender(<Router path="/unregistered" />); expect(screen.getAllByRole('link')).toHaveLength(2)
})
