// @vitest-environment jsdom
import { act, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Talk from './Talk'

const ghost = () => document.querySelector('[data-entity-id="howto-ghost"]')

describe('How to Make a Presentation', () => {
  afterEach(cleanup)

  it('animates departing entities out instead of removing them instantly', async () => {
    render(<Talk />)
    for (let step = 0; step < 4; step += 1) act(() => { fireEvent.keyDown(window, { key: 'ArrowRight' }) })
    expect(ghost()).not.toBeNull()
    act(() => { fireEvent.keyDown(window, { key: 'ArrowRight' }) })
    expect(ghost()).not.toBeNull()
    await waitFor(() => expect(ghost()).toBeNull(), { timeout: 3000 })
  }, 15000)
})
