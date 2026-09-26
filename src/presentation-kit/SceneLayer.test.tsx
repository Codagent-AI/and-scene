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
})
