import { vi, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
vi.mock('../src/presentations', () => ({ presentations: [
  { slug: 'first', title: 'First', load: async () => ({ default: () => <p>First scene</p> }) },
  { slug: 'second', title: 'Second', load: async () => ({ default: () => <p>Second scene</p> }) },
] }))
import { Router } from '../src/Router'
it('I-26 multiple registered presentations coexist with landing links and fallback', async () => {
  const view = render(<Router pathname="/" />)
  expect(screen.getByRole('link', { name: /First/ }).getAttribute('href')).toBe('/first')
  expect(screen.getByRole('link', { name: /Second/ }).getAttribute('href')).toBe('/second')
  view.rerender(<Router pathname="/first" />); expect(await screen.findByText('First scene')).toBeTruthy()
  view.rerender(<Router pathname="/second" />); expect(await screen.findByText('Second scene')).toBeTruthy()
  view.rerender(<Router pathname="/missing" />); expect(screen.getByRole('link', { name: /First/ })).toBeTruthy()
})
