// @vitest-environment jsdom
// Real motion (no mocks): checks the entrance start state, exits, and navigation of the committed sample.
import type { ComponentType } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { Presentation, SceneLayer, Box, type SceneProps, type Step } from '../../src/presentation-kit'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { stubViewport } from './fixtures'

beforeEach(() => {
  stubViewport(1280)
})

const EXPECTED = STEPS.map((step) => [step.title, step.caption])

function titleOf(container: HTMLElement) {
  return container.querySelector('[data-presentation-step-title]')?.textContent
}

function captionOf(container: HTMLElement) {
  return container.querySelector('[data-presentation-caption]')?.textContent
}

describe('reference sample navigation', () => {
  it('walks every step forward with Next, then backward with Previous, showing each title and caption', () => {
    const { container } = render(<Presentation title="Deck" steps={STEPS} initialMode="browse" />)
    const next = () => fireEvent.click(container.querySelector('[data-presentation-next]')!)
    const prev = () => fireEvent.click(container.querySelector('[data-presentation-prev]')!)
    for (let i = 0; i < STEPS.length; i += 1) {
      expect(container.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe(String(i))
      expect([titleOf(container), captionOf(container)]).toEqual(EXPECTED[i])
      if (i < STEPS.length - 1) next()
    }
    expect((container.querySelector('[data-presentation-next]') as HTMLButtonElement).disabled).toBe(true)
    for (let i = STEPS.length - 1; i >= 0; i -= 1) {
      expect(container.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe(String(i))
      expect([titleOf(container), captionOf(container)]).toEqual(EXPECTED[i])
      if (i > 0) prev()
    }
    expect((container.querySelector('[data-presentation-prev]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('a newcomer starts invisible before its entrance: its wrapper begins at opacity 0', () => {
    const { container } = render(<Presentation title="Deck" steps={STEPS} initialMode="browse" />)
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    const wrappers = [...container.querySelectorAll<HTMLElement>('[data-presentation-appear]')]
    expect(wrappers.length).toBeGreaterThan(0)
    for (const wrapper of wrappers) expect(wrapper.style.opacity).toBe('0')
  })
})

describe('scene changes keep the outgoing scene for its exit', () => {
  it('when the scene component changes within one group, both scenes are present until the outgoing one exits', async () => {
    function SceneA({ payload }: SceneProps<string>) {
      return <SceneLayer><Box id={payload} /></SceneLayer>
    }
    function SceneB({ payload }: SceneProps<string>) {
      return <SceneLayer><Box id={payload} /></SceneLayer>
    }
    const steps: Step<string>[] = [
      { id: 'a', era: 'e', title: 'A', caption: 'a', groupKey: 'g', Scene: SceneA as ComponentType<SceneProps<string>>, payload: 'one' },
      { id: 'b', era: 'e', title: 'B', caption: 'b', groupKey: 'g', Scene: SceneB as ComponentType<SceneProps<string>>, payload: 'two' },
    ]
    const { container } = render(<Presentation title="t" steps={steps} />)
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    expect(container.querySelectorAll('[data-presentation-scene]').length).toBe(2)
    expect(container.querySelector('[data-presentation-id="one"]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-id="two"]')).not.toBeNull()
    await waitFor(() => expect(container.querySelectorAll('[data-presentation-scene]').length).toBe(1), { timeout: 4000 })
    expect(container.querySelector('[data-presentation-id="one"]')).toBeNull()
    expect(container.querySelector('[data-presentation-id="two"]')).not.toBeNull()
  })
})
