// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { Box, Presence, SceneLayer } from '..'
import { SceneGate } from './entity'

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

  it('lets a newcomer fade in once the scene has settled and then releases default opacity', async () => {
    const { rerender } = render(scene(['a']))
    rerender(scene(['a', 'b']))
    await waitFor(() => expect(screen.getByTestId('b').style.opacity).toBe(''), { timeout: 2000 })
  })

  it('keeps an author-supplied inline opacity as the entrance target', async () => {
    const authored = (ids: string[]) => <SceneLayer>
      <Presence>{ids.map((id) => <Box key={id} id={id} data-testid={id} style={{ opacity: 0.4 }}>{id}</Box>)}</Presence>
    </SceneLayer>
    const { rerender } = render(authored(['a']))
    rerender(authored(['a', 'b']))
    await waitFor(() => expect(screen.getByTestId('b').style.opacity).toBe('0.4'), { timeout: 2000 })
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(screen.getByTestId('b').style.opacity).toBe('0.4')
    expect(screen.getByTestId('a').style.opacity).toBe('0.4')
  })
})

describe('SceneGate', () => {
  it('holds newcomers until every moving entity has finished its layout animation', async () => {
    const gate = new SceneGate()
    const mover = {}
    gate.layoutStart(mover)
    let settled = false
    const cancel = gate.whenSettled(() => { settled = true })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(settled).toBe(false)
    gate.layoutEnd(mover)
    expect(settled).toBe(true)
    cancel()
  })

  it('settles right away when nothing is moving', async () => {
    const gate = new SceneGate()
    let settled = false
    gate.whenSettled(() => { settled = true })
    await waitFor(() => expect(settled).toBe(true))
  })
})
