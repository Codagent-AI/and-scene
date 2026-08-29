import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PathnameRouter } from './PathnameRouter'
import type { PresentationRegistration } from './presentations'
import { pathnameToSlug } from './routing'

const registrations: readonly PresentationRegistration[] = [
  {
    slug: 'example',
    title: 'Example presentation',
    load: async () => ({ default: () => <main data-example-route="true">Example route</main> }),
  },
]

test('routes the landing and unknown paths to registered presentation links', () => {
  const { rerender } = render(<PathnameRouter pathname="/" presentations={registrations} />)
  expect(screen.getByRole('link', { name: 'Example presentation' }).getAttribute('href')).toBe('/example')

  rerender(<PathnameRouter pathname="/missing" presentations={registrations} />)
  expect(screen.getByRole('link', { name: 'Example presentation' })).toBeTruthy()
  expect(pathnameToSlug('/example')).toBe('example')
  expect(pathnameToSlug('/nested/path')).toBeNull()
})

test('lazy-loads a registered presentation route', async () => {
  render(<PathnameRouter pathname="/example" presentations={registrations} />)
  expect(await screen.findByText('Example route')).toBeTruthy()
})
