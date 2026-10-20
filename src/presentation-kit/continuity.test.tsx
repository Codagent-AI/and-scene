import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Appear } from './nodes/Appear.tsx'
import { Box } from './nodes/Box.tsx'
import { SceneLayer } from './nodes/SceneLayer.tsx'
import { Stage } from './Stage.tsx'
import type { SceneProps, Step } from './types.ts'

interface P {
  x: number
  label: string
  emphasized: boolean
  extra: boolean
}

function Scene({ payload }: SceneProps<P>) {
  return (
    <SceneLayer>
      {/* Continuing entity: keeps identity, never wrapped as a newcomer. */}
      <Box
        key="hero"
        layoutId="hero"
        data-emphasis={payload.emphasized ? 'on' : 'off'}
        style={{ position: 'absolute', left: payload.x, top: 10, width: 50 + payload.x }}
      >
        {payload.label}
      </Box>
      {payload.extra ? (
        <Appear key="extra" data-newcomer="">
          <Box layoutId="extra" />
        </Appear>
      ) : null}
    </SceneLayer>
  )
}

const mk = (payload: P): Step<P> => ({ id: 's', era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene, payload })

describe('continuing entities', () => {
  it('stay the same mounted element while geometry, label, and emphasis change', () => {
    const { container, rerender } = render(<Stage step={mk({ x: 0, label: 'one', emphasized: false, extra: false })} mode="browse" />)
    const hero = container.querySelector<HTMLElement>('[data-presentation-id="hero"]')!
    expect(hero.closest('[data-presentation-appear]')).toBeNull()
    rerender(<Stage step={mk({ x: 200, label: 'two', emphasized: true, extra: true })} mode="browse" />)
    const after = container.querySelector<HTMLElement>('[data-presentation-id="hero"]')!
    expect(after).toBe(hero)
    expect(after.textContent).toBe('two')
    expect(after.style.left).toBe('200px')
    expect(after.getAttribute('data-emphasis')).toBe('on')
    // Only the newcomer is wrapped in the fade-in.
    expect(after.closest('[data-presentation-appear]')).toBeNull()
    expect(container.querySelectorAll('[data-newcomer]')).toHaveLength(1)
    expect(container.querySelector('[data-newcomer] [data-presentation-id="extra"]')).not.toBeNull()
  })
})
