import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Box, SceneLayer, Stage } from '../presentation-kit'
import { makeSteps } from './helpers'

// Real Motion (no mock): a removed entity must stay mounted while it exits, then leave the DOM.
const has = (id: string) => document.querySelector(`[data-presentation-entity="${id}"]`) !== null

describe('departing entities (real Motion)', () => {
  it('keeps a removed entity mounted while it exits, then removes it; continuing entities stay', async () => {
    const view = (withGone: boolean) => (
      <SceneLayer>
        <Box key="stay" id="stay" />
        {withGone ? <Box key="gone" id="gone" /> : null}
      </SceneLayer>
    )
    const { rerender } = render(view(true))
    const stay = document.querySelector('[data-presentation-entity="stay"]')
    rerender(view(false))
    expect(has('gone'), 'still exiting right after removal').toBe(true)
    await waitFor(() => expect(has('gone')).toBe(false), { timeout: 3000 })
    expect(document.querySelector('[data-presentation-entity="stay"]')).toBe(stay)
  })

  it('swaps scenes: the previous scene exits and is removed while the next is mounted', async () => {
    const steps = makeSteps(2)
    const scenes = () => document.querySelectorAll('[data-presentation-scene]')
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    expect(document.body.textContent).toContain('scene 1 of s1')
    await act(async () => {
      rerender(<Stage steps={steps} index={1} mode="browse" />)
    })
    expect(document.body.textContent).toContain('scene 2 of s2')
    await waitFor(() => expect(scenes()).toHaveLength(1), { timeout: 3000 })
    expect(document.body.textContent).not.toContain('scene 1 of s1')
  })
})
