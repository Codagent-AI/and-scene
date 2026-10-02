// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { Box, Presence, SceneLayer } from '..'

afterEach(cleanup)

const scene = (ids: string[]) => <SceneLayer>
  <Presence>{ids.map((id) => <Box key={id} id={id} data-testid={id}>{id}</Box>)}</Presence>
</SceneLayer>

describe('entity enter and exit motion', () => {
  it('shows entities from a scene\'s first render in place and fades in later newcomers', () => {
    const { rerender } = render(scene(['a']))
    expect(screen.getByTestId('a').style.opacity).not.toBe('0')
    rerender(scene(['a', 'b']))
    expect(screen.getByTestId('b').style.opacity).toBe('0')
    expect(screen.getByTestId('a').style.opacity).not.toBe('0')
  })

  it('keeps a departing entity mounted while it animates out, then removes it', async () => {
    const { rerender } = render(scene(['a', 'b']))
    rerender(scene(['a']))
    expect(screen.queryByTestId('b')).not.toBeNull()
    await waitFor(() => expect(screen.queryByTestId('b')).toBeNull(), { timeout: 2000 })
    expect(screen.getByTestId('a')).toBeTruthy()
  })
})
