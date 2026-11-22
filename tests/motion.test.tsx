// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { AnimatePresence } from 'motion/react'
import { Appear, Box } from '../src/presentation-kit'

afterEach(cleanup)
it('I-5 real presence retains a departing entity until its exit finishes', async () => {
  const {container,rerender} = render(<AnimatePresence><Box key="entity" id="entity">Departing</Box></AnimatePresence>)
  expect(container.querySelector('[data-presentation-entity]')).not.toBeNull()
  rerender(<AnimatePresence>{null}</AnimatePresence>)
  expect(container.querySelector('[data-presentation-entity]')).not.toBeNull()
  await waitFor(() => expect(container.querySelector('[data-presentation-entity]')).toBeNull(), {timeout:2500})
})
it('I-5 real newcomers begin transparent and finish appearing after the layout interval', async () => {
  const {container} = render(<Appear><Box id="new">New</Box></Appear>)
  const appearance = container.querySelector('[data-presentation-appear]') as HTMLElement
  expect(appearance.style.opacity).toBe('0')
  await waitFor(() => expect(Number(appearance.style.opacity)).toBeGreaterThan(0.99), {timeout:2500})
})
