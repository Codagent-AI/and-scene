import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Scene } from './Scene'

afterEach(cleanup)

describe('reference sample scene', () => {
  it('holds newcomers hidden behind the kit enter delay instead of popping them in', () => {
    const { rerender } = render(<Scene payload={{ index: 0 }} />)
    rerender(<Scene payload={{ index: 1 }} />)
    const newcomer = screen.getByText('The skill').closest('[data-presentation-appear]') as HTMLElement | null
    expect(newcomer).not.toBeNull()
    expect(newcomer?.style.opacity).toBe('0')
  })

  it('keeps departing entities mounted so they can animate out', () => {
    const { rerender } = render(<Scene payload={{ index: 0 }} />)
    rerender(<Scene payload={{ index: 1 }} />)
    expect(screen.queryByText('“I have a topic…”')).not.toBeNull()

    const back = render(<Scene payload={{ index: 5 }} />)
    back.rerender(<Scene payload={{ index: 4 }} />)
    expect(back.container.querySelector('.kit-label')).not.toBeNull()
  })

  it('does not fade in entities that are already on screen at first render', () => {
    render(<Scene payload={{ index: 8 }} />)
    for (const wrapper of document.querySelectorAll<HTMLElement>('[data-presentation-appear]')) expect(wrapper.style.opacity).not.toBe('0')
  })
})
