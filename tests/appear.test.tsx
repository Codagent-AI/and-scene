// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Appear } from '../src/presentation-kit/nodes/Appear'

describe('appear and exit behavior', () => {
  it('retains a departing entity until its exit animation completes', async () => {
    const { getByText, queryByText, rerender } = render(<Appear present>departing entity</Appear>)
    expect(getByText('departing entity')).toBeTruthy()
    rerender(<Appear present={false}>departing entity</Appear>)
    expect(getByText('departing entity')).toBeTruthy()
    await waitFor(() => expect(queryByText('departing entity')).toBeNull(), { timeout: 1200 })
  })
})
