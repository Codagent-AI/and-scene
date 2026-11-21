import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import Router from '../src/Router'
import { createRoutes } from '../src/routes'

test('landing links and fallback preserve lazy route coexistence', async () => {
  const first = vi.fn(async () => ({ default: () => <h1>First route</h1> }))
  const second = vi.fn(async () => ({ default: () => <h1>Second route</h1> }))
  const third = vi.fn(async () => ({ default: () => <h1>Third route</h1> }))
  const entries = [
    { slug: 'first', title: 'First', load: first },
    { slug: 'second', title: 'Second', load: second },
    { slug: 'third', title: 'Third', load: third },
  ]

  const routes = createRoutes(entries)
  const view = render(<Router pathname="/" routes={routes.slice(0, 2)} />)
  expect(screen.getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(['/first', '/second'])
  view.rerender(<Router pathname="/unknown" routes={routes} />)
  expect(screen.getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(['/first', '/second', '/third'])
  expect(first).not.toHaveBeenCalled()
  expect(second).not.toHaveBeenCalled()
  expect(third).not.toHaveBeenCalled()

  for (const [slug, title, loader] of [['second', 'Second route', second], ['first', 'First route', first], ['third', 'Third route', third]] as const) {
    view.rerender(<Router pathname={`/${slug}`} routes={routes} />)
    expect(await screen.findByRole('heading', { name: title })).toBeTruthy()
    expect(loader).toHaveBeenCalledTimes(1)
  }
})
