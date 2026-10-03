import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Talk from './Talk'

const entity = (name: string) => document.querySelector(`[data-entity-id="how-to:${name}"]`)
function goToStep(step: number) {
  const current = Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) + 1
  for (let index = current; index < step; index++) fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
}

describe('how-to-make-a-presentation sample', () => {
  it('introduces every entity through the kit Appear primitive so newcomers animate in', () => {
    render(<Talk />)
    goToStep(9)
    const entities = [...document.querySelectorAll('.how-scene [data-entity-id]')]
    expect(entities.length).toBeGreaterThan(15)
    for (const element of entities) expect(element, element.getAttribute('data-entity-id') ?? '').toHaveAttribute('data-presentation-appear')
  })

  it('draws the link between consecutive step cards as cards accumulate', () => {
    render(<Talk />)
    goToStep(2)
    expect(entity('step-1')).toBeNull()
    goToStep(3)
    expect(entity('step-1')).not.toBeNull()
    expect(entity('link-1')).toHaveTextContent('size')
    expect(entity('link-2')).toBeNull()
    goToStep(4)
    expect(entity('step-2')).not.toBeNull()
    expect(entity('step-3')).not.toBeNull()
    expect(entity('link-2')).toHaveTextContent('label')
    expect(entity('step-1')).not.toHaveTextContent('size')
  })
})
