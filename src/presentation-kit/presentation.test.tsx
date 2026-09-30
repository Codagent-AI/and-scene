import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { Box } from './nodes/Box'
import { SceneLayer } from './nodes/SceneLayer'
import type { SceneProps, Step } from './types'

type Payload = { label: string }

let sceneMounts = 0

function GroupedScene({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    sceneMounts += 1
  }, [])

  return <div data-scene-label={payload.label}>{payload.label}</div>
}

const steps: Step<Payload>[] = [
  {
    id: 'first',
    era: 'Start',
    title: 'First step',
    caption: 'The first caption.',
    groupKey: 'story',
    Scene: GroupedScene,
    payload: { label: 'first' },
  },
  {
    id: 'second',
    era: 'Middle',
    title: 'Second step',
    caption: 'The second caption.',
    groupKey: 'story',
    Scene: GroupedScene,
    payload: { label: 'second' },
  },
]

function ExitingScene({ payload }: SceneProps<{ showSecondary: boolean }>) {
  return (
    <SceneLayer>
      <Box layoutId="primary">primary</Box>
      {payload.showSecondary && <Box key="secondary" layoutId="secondary">secondary</Box>}
    </SceneLayer>
  )
}

const exitingSteps: Step<{ showSecondary: boolean }>[] = [
  { id: 'with-secondary', era: 'Exit', title: 'With', caption: 'With secondary.', groupKey: 'exit', Scene: ExitingScene, payload: { showSecondary: true } },
  { id: 'without-secondary', era: 'Exit', title: 'Without', caption: 'Without secondary.', groupKey: 'exit', Scene: ExitingScene, payload: { showSecondary: false } },
]

describe('Presentation', () => {
  it('keeps typed grouped payloads at the presentation boundary and updates their scene in place', () => {
    sceneMounts = 0
    render(<Presentation steps={steps} title="Typed story" initialMode="browse" />)

    expect(screen.getByTestId('presentation-stage')).toHaveTextContent('first')
    expect(sceneMounts).toBe(1)

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))

    expect(screen.getByTestId('presentation-stage')).toHaveTextContent('second')
    expect(sceneMounts).toBe(1)
  })

  it('exposes active navigation semantics, attribution, and clamps direct navigation at both ends', () => {
    render(<Presentation steps={steps} title="Navigation" initialMode="browse" />)

    const chrome = screen.getByTestId('presentation-chrome')
    expect(chrome).toHaveAttribute('data-step-count', '2')
    expect(chrome).toHaveAttribute('data-step-index', '0')
    expect(screen.getByRole('button', { name: 'First step' })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'First step' })).toHaveAttribute('data-presentation-active', 'true')
    expect(screen.getByTestId('presentation-attribution')).toHaveAttribute(
      'href',
      'https://github.com/Codagent-AI/and-scene',
    )
    expect(screen.queryByRole('link', { name: /and-scene/i })).toBe(screen.getByTestId('presentation-attribution'))

    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(chrome).toHaveAttribute('data-step-index', '0')
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(chrome).toHaveAttribute('data-step-index', '1')
  })

  it('switches modes without changing the active step and does not hijack keys consumed by focused controls', () => {
    render(<Presentation steps={steps} title="Modes" initialMode="browse" />)

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(screen.getByTestId('presentation-root')).toHaveAttribute('data-presentation-mode', 'present')
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')
    expect(screen.queryByText('The second caption.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next step' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    const previous = screen.getByRole('button', { name: 'Previous step' })
    previous.focus()
    fireEvent.keyDown(previous, { key: ' ' })
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')
  })

  it('keeps deck arrow navigation active when a focused button does not consume the key', () => {
    render(<Presentation steps={steps} title="Keyboard navigation" initialMode="browse" />)

    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })

    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')
  })

  it('shows the table of contents only on wide browse viewports', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 })
    render(<Presentation steps={steps} title="Responsive" initialMode="browse" />)

    expect(screen.queryByRole('navigation', { name: 'Presentation sections' })).not.toBeInTheDocument()
  })

  it('keeps a departing primitive mounted long enough to play its exit animation', () => {
    render(<Presentation steps={exitingSteps} title="Departing entities" initialMode="browse" />)

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))

    expect(screen.getByText('secondary')).toBeInTheDocument()
  })
})
