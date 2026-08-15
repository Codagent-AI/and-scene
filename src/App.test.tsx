import { render, screen } from '@testing-library/react'
import App from './App'

test('the landing page introduces registered presentations', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: 'Presentations' })).toBeTruthy()
})
