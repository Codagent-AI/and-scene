import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Router } from '../../src/Router'
import { createRoutes } from '../../src/routes'
import { presentations } from '../../src/presentations'
it('I-18 keeps explicit registry links lazy routes coexistence and unknown fallback', async () => {
  const one = vi.fn(async () => ({ default: () => <div>one route</div> })), two = vi.fn(async () => ({ default: () => <div>two route</div> }))
  const entries = [{ slug: 'one', title: 'One', load: one }, { slug: 'two', title: 'Two', load: two }]
  const routes = createRoutes(entries)
  const { rerender } = render(<Router pathname="/" routes={routes} />)
  expect(screen.getByText('One').getAttribute('href')).toBe('/one'); expect(screen.getByText('Two').getAttribute('href')).toBe('/two'); expect(one).not.toHaveBeenCalled(); expect(two).not.toHaveBeenCalled()
  rerender(<Router pathname="/one" routes={routes} />); expect(await screen.findByText('one route')).toBeTruthy(); expect(two).not.toHaveBeenCalled()
  rerender(<Router pathname="/two/" routes={routes} />); expect(await screen.findByText('two route')).toBeTruthy()
  rerender(<Router pathname="/unknown" routes={routes} />); expect(screen.getByText('One')).toBeTruthy(); expect(screen.getByText('Two')).toBeTruthy(); expect(presentations[0].slug).toBe('how-to-make-a-presentation')
})
