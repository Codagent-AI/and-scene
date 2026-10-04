import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { resolvePresentationSlug } from '../src/route'
import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'

afterEach(cleanup)

let mounts = 0
function TypedScene({ payload }: SceneProps<{ value: number }>) {
  useEffect(() => { mounts += 1 }, [])
  return <div data-testid="payload">{payload.value}</div>
}

const typedSteps: readonly Step<{ value: number }>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', groupKey: 'story', Scene: TypedScene, payload: { value: 1 } },
  { id: 'two', era: 'Build', title: 'Second', caption: 'Second caption', groupKey: 'story', Scene: TypedScene, payload: { value: 2 } },
]

describe('presentation kit contract', () => {
  it('accepts typed grouped payloads at the Presentation boundary and retains the scene', () => {
    mounts = 0
    render(<Presentation steps={typedSteps} title="Typed" attribution={false} />)
    expect(screen.getByTestId('payload').textContent).toBe('1')
    const initialMounts = mounts
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('payload').textContent).toBe('2')
    expect(mounts).toBe(initialMounts)
  })

  it('clamps navigation and exposes semantic active state', () => {
    const view = render(<Presentation steps={typedSteps} title="Typed" attribution={false} />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: Second' }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    expect(screen.getByRole('button', { name: 'Step 2: Second' }).getAttribute('aria-current')).toBe('step')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    view.rerender(<Presentation steps={typedSteps.slice(0, 1)} title="Typed" attribution={false} />)
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('resolves routes below the configured Vite base path', () => {
    expect(resolvePresentationSlug('/studio/architecture/', '/studio/')).toBe('architecture')
    expect(resolvePresentationSlug('/studio/', '/studio/')).toBe('')
    expect(resolvePresentationSlug('/elsewhere/architecture', '/studio/')).toBe('elsewhere/architecture')
  })

  it('switches modes without changing position and renders default attribution', () => {
    render(<Presentation steps={typedSteps} title="Typed" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    expect(screen.getByRole('main').getAttribute('data-presentation-mode')).toBe('present')
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('')
  })

  it('does not steal navigation keys from focused controls', () => {
    render(<Presentation steps={typedSteps} title="Typed" />)
    screen.getByRole('button', { name: 'Step 2: Second' }).focus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Step 2: Second' }), { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })
})
