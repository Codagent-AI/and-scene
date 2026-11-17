import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
afterEach(cleanup)
it.each([2, 7, 9])('R6 arrow-only entities have usable accessible image names at beat %i', beat => {
  render(<Scene payload={{ beat }} />)
  const conversation = screen.getByRole('img', { name: 'two-way conversation between you and skill' })
  expect(conversation.getAttribute('data-entity')).toBe('conversation')
  expect(conversation.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  if (beat >= 7) {
    const verify = screen.getByRole('img', { name: 'then verify' })
    expect(verify.getAttribute('data-entity')).toBe('verify-link')
    expect(verify.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByRole('img', { name: 'verification passed' }).hasAttribute('data-verification-pass')).toBe(true)
  }
  expect(screen.getAllByRole('img')).toHaveLength(beat >= 7 ? 3 : 1)
})
it('R6 card fields remain readable content rather than flattened image descendants', () => {
  const { container } = render(<Scene payload={{ beat: 3 }} />)
  const card = container.querySelector('[data-entity="card-1"]')!
  expect(card.hasAttribute('role')).toBe(false)
  expect(card.textContent).toBe('titlecaptionvisual')
})
