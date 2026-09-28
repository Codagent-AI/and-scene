import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Presentation } from '../Presentation'
import { buildFixtureSteps } from './fixtures'

const VISUAL_STYLE_PATTERN = /color|background|border|box-shadow|font/i

describe('kit-owned structural layout', () => {
  it('fills the viewport with header, flexing body, and footer so the stage has a definite fit box', () => {
    const { container } = render(<Presentation steps={buildFixtureSteps()} title="Fixture" />)
    const root = container.querySelector<HTMLElement>('[data-presentation-root]')
    expect(root?.style.display).toBe('flex')
    expect(root?.style.flexDirection).toBe('column')
    expect(root?.style.height).toBe('100dvh')

    const body = container.querySelector<HTMLElement>('[data-presentation-body]')
    expect(body?.style.display).toBe('flex')
    expect(body?.style.flexGrow).toBe('1')
    expect(body?.style.minHeight).toBe('0px')

    const stage = container.querySelector<HTMLElement>('[data-presentation-stage]')
    expect(stage?.style.flexGrow).toBe('1')
    expect(stage?.style.minWidth).toBe('0px')
    expect(stage?.style.minHeight).toBe('0px')

    for (const element of [root, body, stage]) {
      expect(element?.getAttribute('style') ?? '').not.toMatch(VISUAL_STYLE_PATTERN)
    }
  })

  it('places the default attribution in the bottom-right corner without visual styling', () => {
    const { container } = render(<Presentation steps={buildFixtureSteps()} title="Fixture" />)
    const attribution = container.querySelector<HTMLElement>('[data-presentation-attribution]')
    expect(attribution?.style.position).toBe('fixed')
    expect(attribution?.style.right).not.toBe('')
    expect(attribution?.style.bottom).not.toBe('')
    expect(attribution?.getAttribute('style') ?? '').not.toMatch(VISUAL_STYLE_PATTERN)
  })
})
