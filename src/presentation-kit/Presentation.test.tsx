import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

type Payload = { label: string }

let sceneInstances = 0

function ExampleScene({ payload }: SceneProps<Payload>) {
  const [instance] = useState(() => ++sceneInstances)
  return <output data-presentation-example-scene="true">{`${instance}:${payload.label}`}</output>
}

const steps: readonly Step<Payload>[] = [
  {
    id: 'start',
    era: 'plan',
    title: 'Start',
    caption: 'The first beat.',
    groupKey: 'example',
    Scene: ExampleScene,
    payload: { label: 'first' },
  },
  {
    id: 'next',
    era: 'build',
    title: 'Next',
    caption: 'The second beat.',
    groupKey: 'example',
    Scene: ExampleScene,
    payload: { label: 'second' },
  },
]

describe('Presentation', () => {
  beforeEach(() => {
    sceneInstances = 0
  })

  it('accepts typed grouped payloads and updates their shared scene in place', () => {
    render(<Presentation steps={steps} title="Example" initialMode="browse" />)

    expect(screen.getByText('1:first')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('1:second')).toBeInTheDocument()
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')
  })

  it('clamps navigation at both ends and exposes semantic active progress', () => {
    render(<Presentation steps={steps} title="Example" />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '0')
    expect(screen.getByRole('button', { name: 'Step 1: Start' })).toHaveAttribute(
      'aria-current',
      'step',
    )
    fireEvent.keyDown(window, { key: 'End' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')
  })

  it('keeps the step while switching between browse and present modes', () => {
    render(<Presentation steps={steps} title="Example" />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'p' })

    expect(screen.getByTestId('presentation-root')).toHaveAttribute('data-presentation-mode', 'present')
    expect(screen.queryByText('The second beat.')).not.toBeInTheDocument()
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')
  })

  it('does not use global navigation keys while a control owns focus', () => {
    render(<Presentation steps={steps} title="Example" />)

    const control = screen.getByRole('button', { name: 'Step 1: Start' })
    control.focus()
    fireEvent.keyDown(control, { key: 'ArrowRight' })

    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '0')
  })

  it('preserves modified browser shortcuts such as Ctrl+P', () => {
    render(<Presentation steps={steps} title="Example" />)

    fireEvent.keyDown(window, { key: 'p', ctrlKey: true })

    expect(screen.getByTestId('presentation-root')).toHaveAttribute('data-presentation-mode', 'browse')
  })

  it('does not navigate while focus is in any enabled editable element', () => {
    render(
      <>
        <div contentEditable="plaintext-only" aria-label="Editor" />
        <Presentation steps={steps} title="Example" />
      </>,
    )

    const editor = screen.getByLabelText('Editor')
    editor.focus()
    fireEvent.keyDown(editor, { key: 'ArrowRight' })

    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '0')
  })

  it('moves between steps on a horizontal touch swipe', () => {
    render(<Presentation steps={steps} title="Example" />)

    const stage = document.querySelector('[data-presentation-stage="true"]')!
    fireEvent.touchStart(stage, { touches: [{ clientX: 200 }] })
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 80 }] })

    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')
  })

  it('does not navigate for a mostly vertical touch gesture', () => {
    render(<Presentation steps={steps} title="Example" />)

    const stage = document.querySelector('[data-presentation-stage="true"]')!
    fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 20 }] })
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 120, clientY: 180 }] })

    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '0')
  })

  it('keeps the clamped position when its step list later grows', () => {
    const view = render(<Presentation steps={steps} title="Example" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')

    view.rerender(<Presentation steps={steps.slice(0, 1)} title="Example" />)
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '0')

    view.rerender(<Presentation steps={steps} title="Example" />)
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '0')
  })

  it('renders the default attribution with its stable styling hook', () => {
    render(<Presentation steps={steps} title="Example" />)

    expect(screen.getByRole('link', { name: 'made by and-scene' })).toHaveAttribute(
      'href',
      'https://github.com/Codagent-AI/and-scene',
    )
    expect(screen.getByRole('link', { name: 'made by and-scene' })).toHaveAttribute(
      'data-presentation-attribution',
      'true',
    )
  })
})
