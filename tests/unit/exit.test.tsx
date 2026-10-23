// @vitest-environment jsdom
// Uses the real motion library: departing entities must stay mounted until their exit completes.
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Box } from '../../src/presentation-kit/nodes/Box'
import { Stage } from '../../src/presentation-kit/Stage'
import type { Step } from '../../src/presentation-kit/types'
import { SceneLayer } from '../../src/presentation-kit/SceneLayer'
import { AnimatePresence } from 'motion/react'

function Scene({ ids }: { ids: string[] }) {
  return (
    <SceneLayer name="test">
      <AnimatePresence>
        {ids.map((id) => (
          <Box key={id} id={id} x={0} y={0} width={10} height={10}>
            <span>{id}</span>
          </Box>
        ))}
      </AnimatePresence>
    </SceneLayer>
  )
}

afterEach(() => cleanup())

function Dropping({ payload }: { payload: { keep: boolean } }) {
  return (
    <AnimatePresence>
      {payload.keep ? null : (
        <Box key="gone" id="gone" x={0} y={0} width={10} height={10}>
          <span>gone-entity</span>
        </Box>
      )}
    </AnimatePresence>
  )
}

function Sibling() {
  return <Box id="other" x={0} y={0} width={10} height={10}><span>other-scene</span></Box>
}

describe('departing entities', () => {
  it('keeps an entity of the old scene mounted through its exit when the scene group changes', async () => {
    const steps: Step<{ keep: boolean }>[] = [
      { id: 'a', era: 'e', title: 'a', caption: 'a', groupKey: 'first', scene: Dropping, payload: { keep: false } },
      { id: 'b', era: 'e', title: 'b', caption: 'b', groupKey: 'second', scene: Sibling, payload: { keep: true } },
    ]
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    expect(screen.queryByText('gone-entity')).not.toBeNull()
    rerender(<Stage steps={steps} index={1} mode="browse" />)
    expect(screen.queryByText('other-scene')).not.toBeNull()
    expect(screen.queryByText('gone-entity')).not.toBeNull()
    await waitFor(() => expect(screen.queryByText('gone-entity')).toBeNull(), { timeout: 4000 })
  })

  it('keeps a dropped entity mounted during its exit, then removes it', async () => {
    const { rerender } = render(<Scene ids={['keep', 'drop']} />)
    rerender(<Scene ids={['keep']} />)
    expect(screen.queryByText('drop')).not.toBeNull()
    await waitFor(() => expect(screen.queryByText('drop')).toBeNull(), { timeout: 4000 })
    expect(screen.queryByText('keep')).not.toBeNull()
  })
})

describe('scene component changes within one group', () => {
  it('keeps an entity of the old scene component mounted through its exit', async () => {
    const steps: Step<{ keep: boolean }>[] = [
      { id: 'a', era: 'e', title: 'a', caption: 'a', groupKey: 'same', scene: Dropping, payload: { keep: false } },
      { id: 'b', era: 'e', title: 'b', caption: 'b', groupKey: 'same', scene: Sibling, payload: { keep: true } },
    ]
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    expect(screen.queryByText('gone-entity')).not.toBeNull()
    rerender(<Stage steps={steps} index={1} mode="browse" />)
    expect(screen.queryByText('gone-entity')).not.toBeNull()
    expect(screen.queryByText('other-scene')).not.toBeNull()
    await waitFor(() => expect(screen.queryByText('gone-entity')).toBeNull(), { timeout: 4000 })
  })
})
