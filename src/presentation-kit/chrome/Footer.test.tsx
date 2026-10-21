import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ATTRIBUTION_HEIGHT } from '../constants'
import { Footer } from './Footer'

const STEPS = [
  { id: 'a', era: 'e', title: 'A', caption: 'first' },
  { id: 'b', era: 'e', title: 'B', caption: 'second' },
]

describe('Footer', () => {
  it.each(['browse', 'present'] as const)(
    'keeps its content in normal flow so author padding insets it (%s)',
    (mode) => {
      const { container } = render(
        <Footer mode={mode} steps={STEPS} index={0} onPrev={() => {}} onNext={() => {}} onJump={() => {}} />,
      )
      const footer = container.querySelector<HTMLElement>('[data-presentation-footer]')!
      const title = container.querySelector<HTMLElement>('[data-presentation-title]')!
      // An absolutely positioned wrapper is placed against the padding box and ignores the footer's padding.
      for (let el: HTMLElement | null = title; el && el !== footer; el = el.parentElement) {
        expect(el.style.position, el.outerHTML).not.toBe('absolute')
      }
      expect(title.parentElement!.style.height).toBe(`calc(100% - ${ATTRIBUTION_HEIGHT}px)`)
    },
  )
})
