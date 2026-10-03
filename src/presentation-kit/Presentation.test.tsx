import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { Presentation } from './Presentation'
import { Appear } from './nodes/Appear'
import { Box } from './nodes/Box'
import type { SceneProps, Step } from './types'

interface Payload { text: string }
function Scene({ payload }: SceneProps<Payload>) {
  const [local, setLocal] = useState(0)
  return <Box id="stable-box" data-state={payload.text}>{payload.text}<button type="button" onClick={() => setLocal((value) => value + 1)}>Local {local}</button></Box>
}
const steps: Step<Payload>[] = [
  { id: 'one', era: 'start', title: 'First', caption: 'First caption', groupKey: 'story', Scene, payload: { text: 'one' } },
  { id: 'two', era: 'finish', title: 'Second', caption: 'Second caption', groupKey: 'story', Scene, payload: { text: 'two' } },
]

describe('Presentation', () => {
  it('accepts strongly typed grouped step payloads and exposes the attribution and active state', () => {
    render(<Presentation steps={steps} title="Typed story" />)
    expect(screen.getByText('made by and-scene').closest('a')).toHaveAttribute('href', 'https://github.com/and-scene')
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('')
    expect(screen.getByRole('button', { name: 'Go to step 1: First' })).toHaveAttribute('aria-current', 'step')
    expect(document.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-count', '2')
  })

  it('navigates, clamps at the end, toggles mode without losing position, and supports TOC jumps', () => {
    render(<Presentation steps={steps} title="Typed story" />)
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(screen.getByText('two')).toBeInTheDocument()
    expect(document.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-index', '1')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-index', '1')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.queryByText('Second caption')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    fireEvent.click(screen.getByRole('button', { name: 'finish' }))
    expect(document.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-index', '1')
  })

  it('does not advance the presentation when a control has focus and allows primitive styling hooks', () => {
    render(<Presentation steps={steps} title="Typed story" />)
    const button = screen.getByRole('button', { name: 'Next step' })
    button.focus()
    fireEvent.keyDown(button, { key: 'ArrowRight' })
    expect(document.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-index', '0')
    expect(document.querySelector('[data-presentation-box]')).toHaveAttribute('data-entity-id', 'stable-box')
  })

  it('keeps the scene instance mounted when adjacent steps share a group', () => {
    render(<Presentation steps={steps} title="Typed story" />)
    fireEvent.click(screen.getByRole('button', { name: 'Local 0' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(screen.getByRole('button', { name: 'Local 1' })).toBeInTheDocument()
    expect(document.querySelector('[data-presentation-box]')).toHaveAttribute('data-entity-id', 'stable-box')
  })

  it('returns keyboard focus to the presentation after switching modes', () => {
    render(<Presentation steps={steps} title="Typed story" />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(document.activeElement).toBe(document.querySelector('[data-presentation-root]'))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-index', '1')
  })

  it('keeps fit dimensions nonnegative when the available viewport is shorter than the chrome', () => {
    const previous = { width: window.innerWidth, height: window.innerHeight }
    render(<Presentation steps={steps} title="Typed story" />)
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 100 })
    fireEvent(window, new Event('resize'))
    const stage = document.querySelector('[data-presentation-stage]')
    expect(parseFloat(stage?.getAttribute('style')?.match(/height: ([\d.-]+)px/)?.[1] ?? '-1')).toBeGreaterThanOrEqual(0)
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: previous.height })
  })

  it('animates a newcomer in after a grouped step change instead of showing it immediately', () => {
    function Grown({ payload }: SceneProps<{ extra: boolean }>) {
      return <><Box id="anchor">anchor</Box>{payload.extra && <Appear id="newcomer">newcomer</Appear>}</>
    }
    const grown: Step<{ extra: boolean }>[] = [
      { id: 'a', era: 'one', title: 'A', caption: 'A caption', groupKey: 'g', Scene: Grown, payload: { extra: false } },
      { id: 'b', era: 'one', title: 'B', caption: 'B caption', groupKey: 'g', Scene: Grown, payload: { extra: true } },
    ]
    render(<Presentation steps={grown} title="Grown" />)
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    const newcomer = document.querySelector('[data-entity-id="newcomer"]')
    expect(newcomer).toHaveStyle({ opacity: '0' })
    expect(document.querySelector('[data-entity-id="anchor"]')).not.toHaveStyle({ opacity: '0' })
  })
})
