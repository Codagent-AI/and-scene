import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders the presentation landing shell', () => {
  render(<App />)

  expect(screen.getByTestId('presentation-landing')).toBeTruthy()
})
