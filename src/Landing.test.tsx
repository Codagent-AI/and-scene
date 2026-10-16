import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import Landing from './Landing'
import { PRESENTATIONS } from './presentations'

it('lists every registered presentation with a link to its route', () => {
  render(<Landing registry={PRESENTATIONS} />)
  for (const entry of PRESENTATIONS) {
    expect(screen.getByRole('link', { name: entry.title }).getAttribute('href')).toBe(`/${entry.slug}`)
  }
})
