import { it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AnimatePresence } from 'motion/react'
import { Appear } from '../../src/presentation-kit/nodes/Appear'
import { Box } from '../../src/presentation-kit/nodes/Box'

it('I-4 departing entity remains mounted while real Motion fades it, then is removed', async () => {
  function Diagram({ shown }: { shown: boolean }) {
    return <AnimatePresence initial={false}>{shown && <Appear key="departing" data-testid="departure"><Box id="test:departing">Departing entity</Box></Appear>}</AnimatePresence>
  }
  const { rerender } = render(<Diagram shown />)
  const departing = screen.getByTestId('departure')
  expect(Number(departing.style.opacity)).toBe(1)
  rerender(<Diagram shown={false} />)
  expect(departing).toBeInTheDocument()
  // An intermediate opacity proves a real animation, not merely delayed removal.
  await waitFor(() => {
    const opacity = Number(departing.style.opacity)
    expect(opacity).toBeGreaterThan(0)
    expect(opacity).toBeLessThan(1)
    expect(departing).toBeInTheDocument()
  }, { interval: 10 })
  await waitFor(() => expect(screen.queryByTestId('departure')).toBeNull())
})
