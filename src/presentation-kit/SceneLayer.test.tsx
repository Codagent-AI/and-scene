// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SceneLayer } from './nodes/SceneLayer.js'
import { Box } from './nodes/Box.js'

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
})
