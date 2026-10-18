import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { typed } from './typing.fixture'

it('renders the typed grouped-payload deck compiled in the fixture', () => {
  const { container } = render(typed)
  expect(container.querySelector('[data-step-count]')?.getAttribute('data-step-count')).toBe('2')
})
