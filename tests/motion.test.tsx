// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useIsPresent } from 'motion/react'
import { Box, SceneLayer } from '../src/presentation-kit'
import { ENTER_DELAY, LAYOUT_T } from '../src/presentation-kit/constants'

vi.mock('motion/react', async importOriginal => {
  const original = await importOriginal<typeof import('motion/react')>()
  const MotionDiv = original.motion.div
  return {
    ...original,
    motion: {
      div: (props: React.ComponentProps<typeof MotionDiv>) => <MotionDiv
        {...props} data-layout-id={props.layoutId} data-layout={String(props.layout)}
        data-initial={JSON.stringify(props.initial)} data-exit={JSON.stringify(props.exit)}
        data-timing={JSON.stringify(props.transition)} />,
    },
  }
})

afterEach(cleanup)

function Presence() {
  return <span data-present={useIsPresent()}>Departing</span>
}

function Diagram({ next }: { next: boolean }) {
  return <SceneLayer>
    <Box key="continuing" id="continuing" data-emphasis={next}
      style={{ left: next ? 100 : 20, width: next ? 80 : 40 }}>
      {next ? 'Updated label' : 'Old label'}
    </Box>
    {next
      ? <Box key="entering" id="entering" enter>Entering</Box>
      : <Box key="departing" id="departing"><Presence /></Box>}
  </SceneLayer>
}

it('projects continuing state in place, defers entry, and retains departing elements during exit', () => {
  const app = render(<Diagram next={false} />)
  const continuing = screen.getByText('Old label')
  const departing = screen.getByText('Departing')
  expect(departing.dataset.present).toBe('true')

  app.rerender(<Diagram next />)

  expect(screen.getByText('Updated label')).toBe(continuing)
  expect(continuing.dataset.layoutId).toBe('continuing')
  expect(continuing.dataset.layout).toBe('true')
  expect(continuing.dataset.initial).toBe('false')
  expect(continuing.style.left).toBe('100px')
  expect(continuing.style.width).toBe('80px')
  expect(continuing.dataset.emphasis).toBe('true')

  const entering = screen.getByText('Entering')
  expect(JSON.parse(entering.dataset.initial!)).toEqual({ opacity: 0 })
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  expect(JSON.parse(entering.dataset.timing!).opacity.delay).toBe(ENTER_DELAY)
  expect(departing.dataset.present).toBe('false')
  expect(JSON.parse(departing.parentElement!.dataset.exit!).opacity).toBe(0)
})
