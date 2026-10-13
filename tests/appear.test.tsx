// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { Presentation } from '../src/presentation-kit/Presentation'

describe('appear and exit behavior', () => {
  it('retains a departing entity until its exit animation completes', async () => {
    const { getByText, queryByText, rerender } = render(<Appear present>departing entity</Appear>)
    expect(getByText('departing entity')).toBeTruthy()
    rerender(<Appear present={false}>departing entity</Appear>)
    expect(getByText('departing entity')).toBeTruthy()
    await waitFor(() => expect(queryByText('departing entity')).toBeNull(), { timeout: 1200 })
  }, 10_000)
})

describe('empty presentations', () => {
  it('renders an explicit empty state instead of dereferencing a missing step', () => {
    const { getByText, getByRole } = render(<Presentation steps={[]} title="Empty deck" />)
    expect(getByRole('main').getAttribute('data-step-count')).toBe('0')
    expect(getByText('No steps defined.').getAttribute('data-presentation-empty')).not.toBeNull()
  })
})
