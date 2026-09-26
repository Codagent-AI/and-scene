// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SceneLayer } from './nodes/SceneLayer.js'
import { Box } from './nodes/Box.js'

let nextInstance = 0
function StatefulBox({ id }: { id: string }) {
  const [instance] = useState(() => ++nextInstance)
  return <Box id={id} data-instance={instance}>{id}</Box>
}

describe('SceneLayer', () => {
  it('keys identity-bearing primitive siblings from their stable entity ids', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<SceneLayer><Box id="left">Left</Box><Box id="right">Right</Box></SceneLayer>)
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('preserves a primitive instance when another entity is inserted before it', () => {
    const { container, rerender } = render(<SceneLayer><Box id="left">Left</Box><Box id="right">Right</Box></SceneLayer>)
    const right = container.querySelector('[data-entity-id="right"]')
    rerender(<SceneLayer><Box id="new">New</Box><Box id="left">Left</Box><Box id="right">Right</Box></SceneLayer>)
    expect(container.querySelector('[data-entity-id="right"]')).toBe(right)
  })

  it('preserves entities with repeated explicit keys in distinct nested arrays', () => {
    const { container, rerender } = render(<SceneLayer>{[[<StatefulBox key="item" id="a" />], [<StatefulBox key="item" id="b" />]]}</SceneLayer>)
    const instanceB = container.querySelector('[data-entity-id="b"]')?.getAttribute('data-instance')
    rerender(<SceneLayer>{[[<StatefulBox key="item" id="b" />]]}</SceneLayer>)
    expect(container.querySelectorAll('[data-entity-id="b"]')).toHaveLength(1)
    expect(container.querySelector('[data-entity-id="b"]')?.getAttribute('data-instance')).toBe(instanceB)
  })

  it('preserves an explicitly keyed entity when a sibling is inserted', () => {
    const { container, rerender } = render(<SceneLayer>{[<StatefulBox key="stable-key" id="stable" />]}</SceneLayer>)
    const stableInstance = container.querySelector('[data-entity-id="stable"]')?.getAttribute('data-instance')
    rerender(<SceneLayer>{[<StatefulBox key="new-key" id="new" />, <StatefulBox key="stable-key" id="stable" />]}</SceneLayer>)
    expect(container.querySelectorAll('[data-entity-id="stable"]')).toHaveLength(1)
    expect(container.querySelector('[data-entity-id="stable"]')?.getAttribute('data-instance')).toBe(stableInstance)
  })
})
