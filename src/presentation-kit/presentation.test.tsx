import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { Step } from './types'

type Payload = { label: string }
const Scene = ({ payload }: { payload: Payload }) => <div>{payload.label}</div>
const steps: Step<Payload>[] = [
  { id: 'first', era: 'Start', title: 'First title', caption: 'First caption', groupKey: 'scene', Scene, payload: { label: 'one' } },
  { id: 'second', era: 'Start', title: 'Second title', caption: 'Second caption', groupKey: 'scene', Scene, payload: { label: 'two' } },
  { id: 'third', era: 'Finish', title: 'Third title', caption: 'Third caption', groupKey: 'scene', Scene, payload: { label: 'three' } },
]

describe('Presentation', () => {
  afterEach(cleanup)
  it('renders browse content, active semantics, default attribution, no default brand, and mode toggle position', () => {
    render(<Presentation steps={steps} title="Demo" />)
    const chrome = screen.getByRole('region', { name: 'Presentation' })
    expect(chrome).toHaveAttribute('data-step-count', '3')
    expect(chrome).toHaveAttribute('data-step-index', '0')
    expect(screen.getByText('First caption')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'made by and-scene' })).toHaveAttribute('href', 'https://github.com/Codagent-AI/and-scene')
    expect(document.querySelector('[data-presentation-header] a')).toBeNull()
    expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-presentation-active', 'true')
    fireEvent.click(screen.getByRole('button', { name: /present mode/i }))
    expect(chrome).toHaveAttribute('data-step-index', '0')
    expect(screen.getByText('First title')).toBeInTheDocument()
    expect(screen.queryByText('First caption')).toBeNull()
  })

  it('allows attribution override and jumps through progress and era-based toc', () => {
    render(<Presentation steps={steps} title="Demo" attribution={{ label: 'Publisher', href: '/publisher' }} />)
    fireEvent.click(screen.getByRole('link', { name: 'Publisher' }))
    expect(screen.getByRole('link', { name: 'Publisher' })).toHaveAttribute('data-presentation-attribution')
    fireEvent.click(screen.getByRole('button', { name: 'Step 3' }))
    expect(screen.getByRole('region', { name: 'Presentation' })).toHaveAttribute('data-step-index', '2')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByRole('region', { name: 'Presentation' })).toHaveAttribute('data-step-index', '0')
  })

  it('keeps a grouped scene instance mounted while payload changes', () => {
    let mounts = 0
    const CountingScene = ({ payload }: { payload: Payload }) => {
      useEffect(() => { mounts += 1 }, [])
      return <div>{payload.label}</div>
    }
    const grouped: Step<Payload>[] = steps.map(step => ({ ...step, Scene: CountingScene }))
    render(<Presentation steps={grouped} title="Demo" />)
    fireEvent.click(screen.getByRole('navigation', { name: 'Step progress' }).querySelector('[aria-label="Step 2"]')!)
    expect(screen.getByText('two')).toBeInTheDocument()
    expect(mounts).toBe(1)
  })
})
