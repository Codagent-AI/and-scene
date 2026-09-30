import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { Box } from './nodes/Box'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
import { calculateFitScale } from './useFitScale'

interface Payload {
  label: string
}

const mount = vi.fn()
const unmount = vi.fn()

function Scene({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    mount()
    return () => unmount()
  }, [])

  return <Box id="persistent-node">{payload.label}</Box>
}

const steps: readonly [Step<Payload>, ...Step<Payload>[]] = [
  {
    id: 'ask',
    era: 'Ask',
    title: 'First title',
    caption: 'A multi-line browse caption.',
    Scene,
    groupKey: 'same-scene',
    payload: { label: 'first' },
  },
  {
    id: 'build',
    era: 'Build',
    title: 'Second title',
    caption: 'Second browse caption.',
    Scene,
    groupKey: 'same-scene',
    payload: { label: 'second' },
  },
]

describe('Presentation', () => {
  test('passes typed grouped payloads through one persistent scene instance', () => {
    mount.mockClear()
    unmount.mockClear()
    render(<Presentation initialMode="browse" steps={steps} title="Typed talk" />)

    expect(screen.getByText('first')).toBeTruthy()
    expect(mount).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('second')).toBeTruthy()
    expect(mount).toHaveBeenCalledTimes(1)
    expect(unmount).not.toHaveBeenCalled()
  })

  test('exposes browse chrome, active navigation semantics, direct jumps, and attribution', () => {
    render(<Presentation initialMode="browse" steps={steps} title="A scene" />)

    const root = document.querySelector('[data-presentation]')
    expect(root?.getAttribute('data-step-count')).toBe('2')
    expect(root?.getAttribute('data-step-index')).toBe('0')
    expect(screen.getByText('A multi-line browse caption.')).toBeTruthy()
    expect(document.querySelector('[data-presentation-progress-active="true"]')?.getAttribute('aria-current')).toBe('step')
    expect(document.querySelector('[data-presentation-toc-active="true"]')?.getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe(
      'https://github.com/Codagent-AI/and-scene',
    )
    expect(document.querySelector('[data-presentation-attribution]')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second title' }))
    expect(root?.getAttribute('data-step-index')).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }))
    expect(root?.getAttribute('data-step-index')).toBe('0')
  })

  test('clamps keyboard navigation and leaves focused controls to their own keys', () => {
    render(<Presentation steps={steps} title="A scene" />)
    const root = document.querySelector('[data-presentation]')!
    const next = screen.getByRole('button', { name: 'Next' })

    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(root.getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('1')
    fireEvent.keyDown(window, { key: 'PageDown' })
    expect(root.getAttribute('data-step-index')).toBe('1')
  })

  test('does not hijack modified browser shortcuts', () => {
    render(<Presentation steps={steps} title="A scene" />)
    const root = document.querySelector('[data-presentation]')!

    fireEvent.keyDown(window, { key: 'p', ctrlKey: true })
    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true })

    expect(root.getAttribute('data-presentation-mode')).toBe('browse')
    expect(root.getAttribute('data-step-index')).toBe('0')
  })

  test('normalizes a stale step index after the step list shrinks', () => {
    const threeSteps: readonly [Step<Payload>, ...Step<Payload>[]] = [
      ...steps,
      { ...steps[1]!, id: 'finish', title: 'Third title', payload: { label: 'third' } },
    ]
    const { rerender } = render(<Presentation steps={threeSteps} title="A scene" />)
    const root = document.querySelector('[data-presentation]')!

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    rerender(<Presentation steps={[steps[0]!, steps[1]!]} title="A scene" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })

    expect(root.getAttribute('data-step-index')).toBe('0')
  })

  test('does not navigate for a vertical touch gesture with horizontal drift', () => {
    render(<Presentation steps={steps} title="A scene" />)
    const root = document.querySelector('[data-presentation]')!

    fireEvent.touchStart(root, { touches: [{ clientX: 200, clientY: 10 }] })
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 100, clientY: 220 }] })

    expect(root.getAttribute('data-step-index')).toBe('0')
  })

  test('switches modes without changing the current step', () => {
    render(<Presentation steps={steps} title="A scene" />)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.keyDown(window, { key: 'p' })

    const root = document.querySelector('[data-presentation]')
    expect(root?.getAttribute('data-presentation-mode')).toBe('present')
    expect(root?.getAttribute('data-step-index')).toBe('1')
    expect(screen.queryByText('Second browse caption.')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.getByText('Second title')).toBeTruthy()
  })

  test('keeps primitives style-neutral while accepting presentation-owned hooks', () => {
    const { container } = render(<Box className="talk-card" id="node" style={{ color: 'plum' }}>Node</Box>)
    const box = container.querySelector('[data-presentation-node="box"]')
    expect(box?.className).toContain('talk-card')
    expect(box?.getAttribute('style')).toContain('color: plum')
    expect(box?.className).not.toContain('theme')
  })

  test('scales the fixed 880 by 380 canvas uniformly', () => {
    expect(calculateFitScale(1760, 1000, 'present')).toBeCloseTo((1760 - 48) / 880)
    expect(calculateFitScale(440, 300, 'browse')).toBeGreaterThan(0)
  })

  test('rejects an empty presentation at the runtime boundary', () => {
    const emptySteps = [] as unknown as readonly [Step<Payload>, ...Step<Payload>[]]
    expect(() => render(<Presentation steps={emptySteps} title="Empty" />)).toThrow(
      'Presentation requires at least one step.',
    )
  })
})
