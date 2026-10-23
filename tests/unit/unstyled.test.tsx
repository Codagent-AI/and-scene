// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from '../../src/presentation-kit/Presentation'
import { SAMPLE_STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'

vi.mock('motion/react', () => import('./support/motionMock'))

// Visual properties the kit may never set inline. Layout geometry is allowed.
const FORBIDDEN = [
  /^color$/,
  /^background/,
  /^font/,
  /^border/,
  /^outline/,
  /^box-shadow$/,
  /^gap$/,
  /^row-gap$/,
  /^column-gap$/,
  /^letter-spacing$/,
  /^line-height$/,
  /^text-/,
  /^(margin|padding)/,
]

// Reset values the browser would otherwise supply (lists and blocks) are not visual choices.
const ZERO_ONLY = /^(margin|padding)/

afterEach(() => cleanup())

describe('unstyled kit output', () => {
  it('sets no colors, fonts, borders, shadows, gaps, or spacing scale on any rendered element', () => {
    const { container } = render(<Presentation steps={SAMPLE_STEPS} title="Unstyled" initialMode="browse" />)
    const offenders: string[] = []
    for (const element of container.querySelectorAll<HTMLElement>('*')) {
      for (const property of Array.from(element.style)) {
        const value = element.style.getPropertyValue(property)
        const forbidden = FORBIDDEN.some((pattern) => pattern.test(property))
        const allowedReset = ZERO_ONLY.test(property) && /^0(px)?$/.test(value)
        if (forbidden && !allowedReset) offenders.push(`${element.tagName.toLowerCase()} ${property}: ${value}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('applies no class names of its own to the chrome', () => {
    const { container } = render(<Presentation steps={SAMPLE_STEPS} title="Unstyled" initialMode="browse" />)
    const root = container.querySelector('[data-presentation-root]') as HTMLElement
    expect(root.className).toBe('')
    expect(container.querySelector('[data-presentation-attribution]')?.className).toBe('')
  })
})
