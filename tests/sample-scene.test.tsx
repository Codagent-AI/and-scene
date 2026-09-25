import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../src/presentation-kit'
import { layout, steps } from '../src/presentations/how-to-make-a-presentation/steps'

function renderStep(number: number) {
  const { container } = render(<Presentation steps={steps} title="Sample" />)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Go to step ${number}:`) }))
  return container
}

const px = (value: string) => Number.parseFloat(value)

describe('reference sample scene content', () => {
  it('docks the partial/full control on you at step 5', () => {
    const container = renderStep(5)
    const control = container.querySelector('.partial-control')
    expect(control?.closest('.you-node')).not.toBeNull()
    expect(container.querySelector('.step-card--flagged')).toBeNull()
    expect(container.querySelector('.ghost-card')).not.toBeNull()
  })

  it('chains a verify node with the pass check after the cards in the same tray row at step 7', () => {
    const container = renderStep(7)
    const verify = container.querySelector<HTMLElement>('.verify-node')!
    const cards = [...container.querySelectorAll<HTMLElement>('.step-card')]
    expect(verify).not.toBeNull()
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) {
      expect(card.style.top).toBe(verify.style.top)
      expect(px(card.style.left)).toBeLessThan(px(verify.style.left))
    }
    expect(verify.querySelector('.pass-check')).not.toBeNull()
    expect(cards.some((card) => card.querySelector('.pass-check'))).toBe(false)
  })

  it('flags only the card the modify arc reaches at step 8', () => {
    const container = renderStep(8)
    const flagged = [...container.querySelectorAll<HTMLElement>('.step-card--flagged')]
    expect(flagged).toHaveLength(1)
    const path = container.querySelector('.modify-arc path')!.getAttribute('d')!
    const [endX, endY] = path.trim().split(/[\s,]+/).slice(-2).map(Number)
    const left = px(flagged[0].style.left)
    const top = px(flagged[0].style.top)
    expect(endX).toBeGreaterThanOrEqual(left)
    expect(endX).toBeLessThanOrEqual(left + layout.cardWidth)
    expect(Math.abs(endY - top)).toBeLessThanOrEqual(4)
  })
})
