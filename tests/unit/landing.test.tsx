import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import Landing from '../../src/Landing'
import { presentations } from '../../src/presentations'

it('lists every registered presentation with a link to its route (I-70)', () => {
  render(<Landing />)
  for (const p of presentations) {
    expect(screen.getByRole('link', { name: p.title }).getAttribute('href')).toBe(`/${p.slug}`)
  }
})
