import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ENTER_DELAY, LAYOUT_T } from '../constants'
import { Appear } from './Appear'

describe('Appear', () => {
  afterEach(cleanup)

  it('waits for layout movement before entering newcomers and leaves continuing entities un-faded', () => {
    expect(ENTER_DELAY).toBeGreaterThan(LAYOUT_T.duration)
    const { rerender } = render(<Appear layoutId="persistent" persisting>Entity</Appear>)
    const continuing = screen.getByText('Entity').closest('[data-presentation-node="appear"]')
    expect(continuing).not.toBeNull()
    expect(continuing).toHaveAttribute('data-presentation-layout-id', 'persistent')
    expect(continuing).not.toHaveStyle({ opacity: '0' })
    rerender(<Appear layoutId="newcomer">Entity</Appear>)
    const newcomer = screen.getByText('Entity').closest('[data-presentation-node="appear"]')
    expect(newcomer).toHaveAttribute('data-presentation-node', 'appear')
  })
})
