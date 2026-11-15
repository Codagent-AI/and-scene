import { it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
// Seed the explicit registry before Router and Landing initialize their routes.
vi.mock('../src/presentations', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/presentations')>()
  return { ...actual, presentations: [...actual.presentations, {
    slug: 'second', title: 'Second presentation',
    load: vi.fn(async () => ({ default: () => <main aria-label="Second presentation"><h1>Second route rendered</h1></main> })),
  }] }
})
import { Router } from '../src/Router'
import { presentations } from '../src/presentations'
it('I-27 both registered routes render and remain reachable after adding another presentation', async () => {
  const original = await vi.importActual<typeof import('../src/presentations')>('../src/presentations')
  const preserved = original.presentations.map(entry => ({ ...entry }))
  const referenceTitle = original.presentations[0].title
  const view = render(<Router pathname="/" />)
  expect(screen.getByRole('link', { name: /Second presentation/ }).getAttribute('href')).toBe('/second')
  expect(screen.getByRole('link', { name: new RegExp(referenceTitle) }).getAttribute('href')).toBe('/how-to-make-a-presentation')
  for (const pathname of ['/how-to-make-a-presentation', '/second', '/how-to-make-a-presentation/', '/second']) {
    view.rerender(<Router pathname={pathname} />)
    const title = pathname === '/second' ? 'Second presentation' : referenceTitle
    expect(await screen.findByRole('main', { name: title })).toBeTruthy()
    if (pathname === '/second') expect(screen.getByRole('heading', { name: 'Second route rendered' })).toBeTruthy()
    else expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-count')).toBe('9')
  }
  expect(presentations[1].load).toHaveBeenCalledTimes(1)
  expect(original.presentations).toEqual(preserved)
  expect(presentations[0]).toBe(original.presentations[0])
  view.rerender(<Router pathname="/unknown" />)
  expect(await screen.findByRole('link', { name: /Second presentation/ })).toBeTruthy()
  expect(document.querySelector('.landing')).toBeTruthy()
})
