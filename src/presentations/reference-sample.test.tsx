import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import Talk from './how-to-make-a-presentation/Talk'

test('the committed reference sample exists as a registered presentation folder', () => {
  expect(existsSync(resolve(import.meta.dirname, 'how-to-make-a-presentation', 'Talk.tsx'))).toBe(true)
  expect(existsSync(resolve(import.meta.dirname, 'how-to-make-a-presentation', 'steps', 'index.tsx'))).toBe(true)
})

test('the verification node replaces the temporary unspecified-step placeholder', async () => {
  render(<Talk />)
  for (let click = 0; click < 6; click += 1) fireEvent.click(screen.getByRole('button', { name: 'Next' }))

  expect(screen.getByText('verify')).toBeTruthy()
  await waitFor(() => expect(screen.queryByText('… unspecified steps')).toBeNull())
})

test('keeps narrow-view headings clear of the mode toggle', () => {
  const stylesheet = readFileSync(resolve(import.meta.dirname, 'how-to-make-a-presentation', 'presentation.css'), 'utf8')
  expect(stylesheet).toContain('padding-right: 86px')
})
