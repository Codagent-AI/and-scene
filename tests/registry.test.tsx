import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
vi.mock('../src/presentations', () => ({ presentations: [
  { slug: 'first', title: 'First presentation', load: async () => ({ default: () => <p>First route</p> }) },
  { slug: 'second', title: 'Second presentation', load: async () => ({ default: () => <p>Second route</p> }) },
] }))
import { Router } from '../src/Router'
import { resolveRoute } from '../src/routes'
it('I-7 multiple explicit entries remain linked and independently lazy-loadable', async () => {
  const { rerender } = render(<Router path="/" />)
  expect(screen.getByRole('link', { name: /First presentation/ }).getAttribute('href')).toBe('/first')
  expect(screen.getByRole('link', { name: /Second presentation/ }).getAttribute('href')).toBe('/second')
  expect(resolveRoute('/first/')?.slug).toBe('first')
  expect(resolveRoute('/second')?.slug).toBe('second')
  rerender(<Router path="/first" />); expect(await screen.findByText('First route')).toBeTruthy()
  rerender(<Router path="/second" />); expect(await screen.findByText('Second route')).toBeTruthy()
  rerender(<Router path="/no-such-route" />); expect(screen.getByRole('link', { name: /First presentation/ })).toBeTruthy()
})
