// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Presentation } from '../../src/presentation-kit'
import { makeSteps, stubMatchMedia } from './fixtures'

/** Inline style properties that carry visual choices, which only author CSS may set. */
const VISUAL_PROPERTIES = [
  'color',
  'background',
  'backgroundColor',
  'border',
  'borderColor',
  'borderRadius',
  'borderTop',
  'boxShadow',
  'font',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'opacity',
  'textDecoration',
]

describe('unstyled kit output', () => {
  it('a presentation with no author CSS sets no visual inline style on any element', () => {
    stubMatchMedia(true)
    const { container } = render(<Presentation title="Deck" steps={makeSteps()} />)
    const offenders: string[] = []
    for (const element of container.querySelectorAll<HTMLElement>('[style]')) {
      for (const property of VISUAL_PROPERTIES) {
        const value = element.style.getPropertyValue(property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))
        if (value) offenders.push(`${element.tagName.toLowerCase()} ${property}=${value}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
