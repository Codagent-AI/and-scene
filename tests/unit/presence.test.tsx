import { AnimatePresence } from 'motion/react'
import { render, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Box } from '../../src/presentation-kit'
it('I-3 departing entities remain for real Motion exit then are removed', async () => {
  const { rerender } = render(<AnimatePresence><Box key="out" id="out">departing</Box></AnimatePresence>)
  rerender(<AnimatePresence>{null}</AnimatePresence>)
  expect(document.querySelector('[data-presentation-entity="out"]')).not.toBeNull()
  await waitFor(() => expect(document.querySelector('[data-presentation-entity="out"]')).toBeNull(), { timeout: 2000 })
})
