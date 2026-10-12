// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { EvolvingScene } from './Scene'
import { steps } from './steps'

const renderScene = (count: number) => <EvolvingScene payload={{ count }} step={steps[count - 1]!} />
const inAppear = (el: Element | null) => Boolean(el?.closest('[data-presentation-appear]'))

afterEach(cleanup)
describe('reference scene entrances', () => {
  it('fades in only the entity a step introduces, never continuing entities', () => {
    const { container, rerender } = render(renderScene(3))
    const you = container.querySelector('.you')
    expect(inAppear(you)).toBe(false)
    expect(container.querySelectorAll('.step-card')).toHaveLength(1)
    rerender(renderScene(4))
    expect(container.querySelector('.you')).toBe(you)
    const cards = [...container.querySelectorAll('.step-card')]
    expect(cards).toHaveLength(2)
    expect(inAppear(cards[1]!)).toBe(true)
    expect(inAppear(you)).toBe(false)
    expect((cards[1]!.closest('[data-presentation-appear]') as HTMLElement).style.opacity).toBe('0')
  })

  it('keeps a departing entity mounted for its exit animation', () => {
    const { container, rerender } = render(renderScene(5))
    expect(container.querySelector('.ghost-card')).toBeTruthy()
    rerender(renderScene(4))
    expect(container.querySelector('.ghost-card')).toBeTruthy()
  })
})
