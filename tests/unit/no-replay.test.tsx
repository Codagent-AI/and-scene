// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/SampleScene.tsx'

const scene = (stage: number) => (
  <SampleScene payload={{ stage }} step={{ id: 's', era: 'e', title: 't', caption: 'c' }} index={stage - 1} mode="browse" />
)
const wrapperOf = (container: HTMLElement, id: string) =>
  container.querySelector(`[data-presentation-entity="${id}"]`)!.closest<HTMLElement>('[data-presentation-appear]')!

describe('continuing entities do not replay their enter animation (M-08)', () => {
  it('keeps a settled entity fully opaque when the next step arrives, while only the newcomer starts hidden', async () => {
    const view = render(scene(1))
    await waitFor(() => expect(wrapperOf(view.container, 'you').style.opacity).toBe('1'), { timeout: 4000 })
    view.rerender(scene(2))
    expect(wrapperOf(view.container, 'you').style.opacity).toBe('1') // continuing: no fade replay
    expect(wrapperOf(view.container, 'skill').style.opacity).toBe('0') // newcomer: fades in
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(wrapperOf(view.container, 'you').style.opacity).toBe('1')
  })
})
