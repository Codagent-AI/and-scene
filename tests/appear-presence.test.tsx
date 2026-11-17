// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Appear } from '../src/presentation-kit'

const presence = vi.hoisted(() => ({ boundaries: 0 }))
vi.mock('motion/react', () => ({
  motion: { div: ({ children, exit }: Record<string, unknown>) => <div data-presentation-appear="" data-exit={JSON.stringify(exit)}>{children as ReactNode}</div> },
  AnimatePresence: ({ children }: { children: ReactNode }) => { presence.boundaries++; return children },
}))
afterEach(() => { cleanup(); presence.boundaries = 0 })

describe('Appear exit presence', () => {
  it('supplies its own presence boundary when show is given, so exit can run', () => {
    const { container, rerender } = render(<Appear show>shown</Appear>)
    expect(presence.boundaries).toBeGreaterThan(0)
    expect(container.querySelector('[data-presentation-appear]')?.getAttribute('data-exit')).toBe('{"opacity":0}')
    rerender(<Appear show={false}>shown</Appear>)
    expect(container.querySelector('[data-presentation-appear]')).toBeNull()
  })
  it('stays a bare entity when show is omitted', () => {
    const { container } = render(<Appear>plain</Appear>)
    expect(presence.boundaries).toBe(0)
    expect(container.querySelector('[data-presentation-appear]')).not.toBeNull()
  })
})
