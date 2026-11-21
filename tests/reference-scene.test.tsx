// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { BuildScene } from '../src/presentations/how-to-make-a-presentation/steps/BuildScene'

afterEach(cleanup)

function SampleStage({ beat }: { beat: number }) {
  return <section data-presentation-stage="">
    <div data-presentation-canvas="">
      <BuildScene payload={beat} />
    </div>
  </section>
}

it('keeps the map in the fixed canvas and its detailed labels outside it as beats accumulate', () => {
  const { container, rerender } = render(<SampleStage beat={4} />)
  const canvas = container.querySelector<HTMLElement>('[data-presentation-canvas]')!
  const guide = screen.getByRole('complementary', { name: 'Diagram details' })
  const firstCard = within(canvas).getByText('Step A').parentElement!

  expect(guide.parentElement).toBe(canvas.parentElement)
  expect(canvas.contains(guide)).toBe(false)
  expect(firstCard.dataset.compactLabel).toBe('A')
  expect(within(guide).getByText(/title, caption, and visual.*A → B → C.*positions and labels/)).toBeTruthy()
  expect(within(guide).queryByText(/edited card B/)).toBeNull()

  rerender(<SampleStage beat={9} />)
  expect(screen.getAllByRole('complementary', { name: 'Diagram details' })).toEqual([guide])
  expect(within(canvas).getByText('Step A').parentElement).toBe(firstCard)
  expect(within(guide).getByText(/Verify checks the build and render/)).toBeTruthy()
  expect(within(guide).getByText(/return arrow points to the edited card B/)).toBeTruthy()
  expect(within(guide).getByText('Made exactly this way.')).toBeTruthy()
})
