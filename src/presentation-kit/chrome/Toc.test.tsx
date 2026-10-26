import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toc } from './Toc'
import type { Step } from '../types'

function Scene() {
  return null
}

function makeStep(id: string, era: string): Step<undefined> {
  return { id, era, title: id, caption: id, Scene, payload: undefined }
}

const steps: Step<undefined>[] = [
  makeStep('a', 'Origins'),
  makeStep('b', 'Origins'),
  makeStep('c', 'Growth'),
  makeStep('d', 'Future'),
]

describe('Toc', () => {
  it('renders one entry per unique era', () => {
    render(<Toc steps={steps} activeIndex={0} onJump={() => {}} />)
    expect(screen.getByText('Origins')).toBeInTheDocument()
    expect(screen.getByText('Growth')).toBeInTheDocument()
    expect(screen.getByText('Future')).toBeInTheDocument()
  })

  it('marks the era containing the active step as active with a stable hook', () => {
    render(<Toc steps={steps} activeIndex={2} onJump={() => {}} />)
    const growth = screen.getByTestId('toc-entry-Growth')
    expect(growth).toHaveAttribute('data-presentation-active', 'true')
    expect(growth).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId('toc-entry-Origins')).toHaveAttribute('data-presentation-active', 'false')
  })

  it('jumps to the first step of the era on activation', async () => {
    const onJump = vi.fn()
    render(<Toc steps={steps} activeIndex={0} onJump={onJump} />)
    await userEvent.click(screen.getByTestId('toc-entry-Growth'))
    expect(onJump).toHaveBeenCalledWith(2)
  })

  describe('an era that recurs in a later, non-consecutive section', () => {
    const recurring: Step<undefined>[] = [
      makeStep('a', 'Origins'),
      makeStep('b', 'Growth'),
      makeStep('c', 'Origins'),
    ]

    it('renders each section, not just the first use of the era', () => {
      render(<Toc steps={recurring} activeIndex={0} onJump={() => {}} />)
      expect(screen.getAllByText('Origins')).toHaveLength(2)
    })

    it('marks only the section containing the active step as active', () => {
      render(<Toc steps={recurring} activeIndex={2} onJump={() => {}} />)
      const entries = screen.getAllByTestId(/^toc-entry-/)
      expect(entries.map((entry) => entry.getAttribute('data-presentation-active'))).toEqual([
        'false',
        'false',
        'true',
      ])
    })

    it('jumps to the first step of the clicked section', async () => {
      const onJump = vi.fn()
      render(<Toc steps={recurring} activeIndex={0} onJump={onJump} />)
      await userEvent.click(screen.getAllByText('Origins')[1])
      expect(onJump).toHaveBeenCalledWith(2)
    })
  })
})
