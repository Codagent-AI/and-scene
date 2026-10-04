// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import Scene from '../src/presentations/how-to-make-a-presentation/steps/Scene'

afterEach(cleanup)

describe('reference sample scene continuity', () => {
  it('keeps the prompt bubble on screen from step 1 through step 9', () => {
    for (let beat = 1; beat <= 9; beat++) {
      const { container, unmount } = render(<Scene payload={{ beat }} />)
      expect(container.textContent, `beat ${beat}`).toContain('I have an idea')
      unmount()
    }
  })
})
