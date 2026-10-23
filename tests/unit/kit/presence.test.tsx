import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Appear, Box, SceneLayer } from '../../../src/presentation-kit/index.ts'

// Real motion (no mock): a keyed child that leaves a SceneLayer stays mounted
// until its exit animation completes, then disappears (L-6).
describe('departing entities (L-6)', () => {
  const scene = (ids: string[]) => (
    <SceneLayer>
      {ids.map((id) => (
        <Appear key={id} data-id={id} delay={0}>
          <Box layoutId={id}>{id}</Box>
        </Appear>
      ))}
    </SceneLayer>
  )

  it('keeps a departing entity presence-managed until its exit finishes', async () => {
    const { container, rerender } = render(scene(['stay', 'go']))
    const has = (id: string) => container.querySelector(`[data-id="${id}"]`) !== null
    expect(has('go')).toBe(true)
    rerender(scene(['stay']))
    expect(has('go')).toBe(true) // still exiting
    await waitFor(() => expect(has('go')).toBe(false), { timeout: 3000 })
    expect(has('stay')).toBe(true)
  })

  it('does not unmount entities that continue', async () => {
    const { container, rerender } = render(scene(['stay', 'go']))
    const stay = container.querySelector('[data-id="stay"]')
    rerender(scene(['stay']))
    await waitFor(() => expect(container.querySelector('[data-id="go"]')).toBeNull(), { timeout: 3000 })
    expect(container.querySelector('[data-id="stay"]')).toBe(stay)
  })
})
