// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Landing, NotFound } from './Landing.tsx'
import { presentations } from './presentations/index.ts'

describe('Landing', () => {
  it('links to every registered presentation by its slug', () => {
    render(<Landing />)
    for (const p of presentations) {
      expect(screen.getByRole('link', { name: p.title }).getAttribute('href')).toBe(`/${p.slug}`)
    }
  })

  it('enumerates whatever registry it is given', () => {
    render(<Landing registry={[{ slug: 'x', title: 'Ex', load: async () => ({ default: () => null }) }]} />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('NotFound offers a way back', () => {
    render(<NotFound path="/zzz" />)
    expect(screen.getByText(/\/zzz/)).toBeTruthy()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/')
  })
})
