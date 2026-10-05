import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation'
import { Box } from '../nodes/Box'
import { SceneLayer } from '../nodes/SceneLayer'
import type { SceneProps, Step } from '../types'

type Payload = { value: string }
function TestScene({ payload }: SceneProps<Payload>) {
  const [mounts, setMounts] = useState(0)
  return <div><span>{payload.value}</span><button onClick={() => setMounts(mounts + 1)}>Mounts {mounts}</button></div>
}
function ChangingScene({ payload }: SceneProps<Payload>) {
  return <SceneLayer>{payload.value === 'one' ? <Box id="persistent">Persisting</Box> : <><Box id="persistent">Persisting updated</Box><Box id="new" entering>New entity</Box></>}</SceneLayer>
}
const steps: Step<Payload>[] = [
  { id: 'first', era: 'Start', title: 'First title', caption: 'First caption', groupKey: 'flow', Scene: TestScene, payload: { value: 'one' } },
  { id: 'second', era: 'Continue', title: 'Second title', caption: 'Second caption', groupKey: 'flow', Scene: TestScene, payload: { value: 'two' } },
]

describe('Presentation', () => {
  it('accepts strongly typed grouped scene payloads and retains the scene instance', () => {
    render(<Presentation steps={steps} title="Typed" />)
    fireEvent.click(screen.getByRole('button', { name: 'Mounts 0' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second title' }))
    expect(screen.getByText('two')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mounts 1' })).toBeInTheDocument()
  })

  it('keeps stable entity identities and supports newcomer and departing entity animations', async () => {
    const changingSteps: Step<Payload>[] = steps.map((step) => ({ ...step, Scene: ChangingScene }))
    const { container } = render(<Presentation steps={changingSteps} title="Continuity" />)
    const persistent = container.querySelector('[data-presentation-entity="persistent"]')
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second title' }))
    expect(container.querySelector('[data-presentation-entity="persistent"]')).toBe(persistent)
    expect(screen.getByText('New entity')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 1: First title' }))
    await waitFor(() => expect(container.querySelector('[data-presentation-entity="new"]')).toBeNull(), { timeout: 1000 })
  })

  it('provides attribution, active navigation semantics, and step enumeration hooks', () => {
    render(<Presentation steps={steps} title="Typed" />)
    expect(screen.getByRole('link', { name: 'made by and-scene' })).toHaveAttribute('href', 'https://github.com/and-scene')
    expect(document.querySelector('.presentation-header__brand a')).toBeNull()
    expect(screen.getByRole('button', { name: 'Go to step 1: First title' })).toHaveAttribute('aria-current', 'step')
    expect(document.querySelector('[data-presentation-toc-item][aria-current="step"]')).toHaveTextContent('Start')
    expect(document.querySelector('[data-step-count="2"][data-step-index="0"]')).toBeInTheDocument()
  })

  it('clamps navigation, preserves position across modes, and leaves focused control keys alone', () => {
    render(<Presentation steps={steps} title="Typed" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index="0"]')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second title' }))
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(screen.getByText('Second title')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Switch to browse mode' }), { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index="1"]')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index="1"]')).toBeInTheDocument()
  })

  it('keeps kit presentation styles limited to geometry and exports the fixed canvas contract', async () => {
    const { DESIGN_H, DESIGN_W } = await import('../constants')
    const css = readFileSync(resolve(process.cwd(), 'src/presentation-kit/presentation-kit.css'), 'utf8')
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(css).not.toMatch(/(color|background|font-family|box-shadow|border):/)
  })
})
