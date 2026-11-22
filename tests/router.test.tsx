import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Router } from '../src/Router'
import Landing from '../src/Landing'
import { presentations } from '../src/presentations'

const { loadA, loadB } = vi.hoisted(() => ({
  loadA: vi.fn(async () => ({ default: () => <p>Presentation A</p> })),
  loadB: vi.fn(async () => ({ default: () => <p>Presentation B</p> })),
}))
vi.mock('../src/presentations', () => ({
  presentations: [
    { slug: 'a', title: 'A', load: loadA },
    { slug: 'b', title: 'B', load: loadB },
  ],
}))

test('I-7 explicit registry, landing links, lazy matching, coexistence and unknown fallback', async () => {
  const { rerender } = render(<Landing entries={presentations} />)
  expect(
    screen.getAllByRole('link').map((link) => link.getAttribute('href')),
  ).toEqual(['/a', '/b'])
  expect(loadA).not.toHaveBeenCalled()
  rerender(<Router pathname="/b" />)
  await screen.findByText('Presentation B')
  expect(loadB).toHaveBeenCalledTimes(1)
  expect(loadA).not.toHaveBeenCalled()
  rerender(<Router pathname="/a/" />)
  await screen.findByText('Presentation A')
  rerender(<Router pathname="/unknown" />)
  expect(screen.getAllByRole('link')).toHaveLength(2)
  rerender(<Router pathname="/" />)
  expect(screen.getByText('Ideas, in motion.')).toBeTruthy()
})
