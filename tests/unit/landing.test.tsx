import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Landing from '../../src/Landing.tsx'
import { presentations } from '../../src/presentations/index.ts'

describe('Landing', () => {
  it('links to every registered presentation', () => {
    render(<Landing />)
    for (const p of presentations) {
      expect(screen.getByRole('link', { name: p.title }).getAttribute('href')).toBe(`/${p.slug}`)
    }
  })
})
