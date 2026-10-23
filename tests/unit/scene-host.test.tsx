import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { motion } from 'motion/react'
import { StrictMode, useEffect, useRef, useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Appear, Box, hostKey, Presentation, SceneLayer, type SceneProps, type Step } from '../../src/presentation-kit'
import { setViewport } from '../helpers/fixtures'

beforeEach(() => setViewport(1440))

const counters = { mounts: 0, unmounts: 0 }

interface P {
  label: string
  shown: string[]
}

function CountingScene({ payload }: SceneProps<P>) {
  const [local] = useState(() => Math.random())
  useEffect(() => {
    counters.mounts++
    return () => {
      counters.unmounts++
    }
  }, [])
  return <div data-testid="scene" data-local={local}>{payload.label}</div>
}

function OtherScene({ payload }: SceneProps<P>) {
  return <div data-testid="scene">{payload.label}</div>
}

const mk = (id: string, label: string, Scene = CountingScene, groupKey?: string): Step<P> => ({
  id, era: 'e', title: id, caption: id, Scene, payload: { label, shown: [] }, groupKey,
})

const next = () => fireEvent.keyDown(window, { key: 'ArrowRight' })
const index = () => document.querySelector('[data-step-index]')!.getAttribute('data-step-index')

describe('grouped scenes', () => {
  beforeEach(() => {
    counters.mounts = 0
    counters.unmounts = 0
  })

  it('keeps one scene instance (same DOM node, same local state) and only updates the payload within a group', () => {
    render(<Presentation steps={[mk('a', 'one', CountingScene, 'g'), mk('b', 'two', CountingScene, 'g'), mk('c', 'three', CountingScene, 'g')]} title="t" />)
    const node = screen.getByTestId('scene')
    const local = node.getAttribute('data-local')
    expect(counters.mounts).toBe(1)
    next()
    expect(screen.getByTestId('scene')).toBe(node)
    expect(node.textContent).toBe('two')
    next()
    expect(screen.getByTestId('scene')).toBe(node)
    expect(node.textContent).toBe('three')
    expect(node.getAttribute('data-local')).toBe(local)
    expect([counters.mounts, counters.unmounts]).toEqual([1, 0])
  })

  it('remounts when the group key changes', async () => {
    render(<Presentation steps={[mk('a', 'one', CountingScene, 'g1'), mk('b', 'two', CountingScene, 'g2')]} title="t" />)
    const first = screen.getByTestId('scene')
    next()
    expect(counters.mounts).toBe(2)
    await waitFor(() => expect(counters.unmounts).toBe(1), { timeout: 3000 })
    expect(document.body.contains(first)).toBe(false)
    expect(screen.getByTestId('scene').textContent).toBe('two')
  })

  it('remounts when the group is shared but the Scene component differs', async () => {
    render(<Presentation steps={[mk('a', 'one', CountingScene, 'g'), mk('b', 'two', OtherScene, 'g')]} title="t" />)
    expect(counters.mounts).toBe(1)
    next()
    await waitFor(() => expect(counters.unmounts).toBe(1), { timeout: 3000 })
    expect(screen.getByTestId('scene').textContent).toBe('two')
  })

  it('derives the host key from group + Scene, and per step when ungrouped', () => {
    const a = mk('a', 'x', CountingScene, 'g')
    expect(hostKey(a)).toBe(hostKey(mk('b', 'y', CountingScene, 'g')))
    expect(hostKey(a)).not.toBe(hostKey(mk('b', 'y', OtherScene, 'g')))
    expect(hostKey(a)).not.toBe(hostKey(mk('b', 'y', CountingScene, 'h')))
    expect(hostKey(mk('a', 'x'))).not.toBe(hostKey(mk('b', 'x')))
  })

  it('keeps a single stable instance under StrictMode after the initial setup baseline', () => {
    render(
      <StrictMode>
        <Presentation steps={[mk('a', 'one', CountingScene, 'g'), mk('b', 'two', CountingScene, 'g')]} title="t" />
      </StrictMode>,
    )
    const baseline = { ...counters }
    const node = screen.getByTestId('scene')
    next()
    expect(screen.getByTestId('scene')).toBe(node)
    expect(counters).toEqual(baseline)
    expect(baseline.mounts - baseline.unmounts).toBe(1)
  })
})

interface Visible {
  ids: string[]
}

function EntityScene({ payload }: SceneProps<Visible>) {
  const opacityLog = useRef<string[]>([])
  void opacityLog
  return (
    <SceneLayer>
      {payload.ids.map((id) => (
        <Appear key={id}>
          <Box id={`e-${id}`} x={payload.ids.indexOf(id) * 10} y={0} width={5} height={5} data-testid={`e-${id}`} />
        </Appear>
      ))}
    </SceneLayer>
  )
}

const ent = (id: string, ids: string[], groupKey?: string): Step<Visible> => ({
  id, era: 'e', title: id, caption: id, Scene: EntityScene, payload: { ids }, groupKey,
})

describe('entities across steps', () => {
  it('keeps a continuing entity as the same node, not re-wrapped or re-faded as a newcomer', async () => {
    render(<Presentation steps={[ent('a', ['x'], 'g'), ent('b', ['x', 'y'], 'g'), ent('c', ['x', 'y', 'z'], 'g')]} title="t" />)
    const x = screen.getByTestId('e-x')
    const wrapper = x.closest('[data-presentation-appear]')!
    await waitFor(() => expect(wrapper.getAttribute('style')).toContain('opacity: 1'))
    next()
    expect(screen.getByTestId('e-x')).toBe(x)
    expect(x.closest('[data-presentation-appear]')).toBe(wrapper)
    // the continuing entity's wrapper never dips back to a newcomer's initial opacity
    expect(wrapper.getAttribute('style')).toContain('opacity: 1')
    const y = screen.getByTestId('e-y')
    expect(y.closest('[data-presentation-appear]')!.getAttribute('style')).toContain('opacity: 0')
    next()
    expect(wrapper.getAttribute('style')).toContain('opacity: 1')
    fireEvent.keyDown(window, { key: 'ArrowLeft' }) // reverse navigation
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByTestId('e-x')).toBe(x)
    expect(wrapper.getAttribute('style')).toContain('opacity: 1')
    expect(x.getAttribute('data-presentation-entity')).toBe('e-x')
  })

  it('animates a departing entity out before removing it (grouped)', async () => {
    render(<Presentation steps={[ent('a', ['x', 'y'], 'g'), ent('b', ['x'], 'g')]} title="t" />)
    const y = screen.getByTestId('e-y')
    next()
    expect(document.body.contains(y)).toBe(true) // still present while it exits
    await waitFor(() => expect(document.body.contains(y)).toBe(false), { timeout: 3000 })
    expect(screen.getByTestId('e-x')).toBeTruthy()
  })

  it('keeps the exiting scene mounted under AnimatePresence, then removes it (ungrouped)', async () => {
    render(<Presentation steps={[ent('a', ['x']), ent('b', ['y'])]} title="t" />)
    const scenes = () => document.querySelectorAll('[data-presentation-scene]')
    expect(scenes()).toHaveLength(1)
    const old = scenes()[0]
    next()
    expect(scenes().length).toBe(2)
    expect(index()).toBe('1')
    await waitFor(() => expect(document.body.contains(old)).toBe(false), { timeout: 3000 })
    expect(scenes()).toHaveLength(1)
  })

  it('shares a layoutId between adjacent ungrouped steps for the continuing entity', () => {
    render(<Presentation steps={[ent('a', ['x']), ent('b', ['x', 'y'])]} title="t" />)
    next()
    const ids = [...document.querySelectorAll('[data-presentation-entity="e-x"]')]
    expect(ids.length).toBeGreaterThanOrEqual(1)
  })

  it('preserves supplied coordinates and stacking exactly (no normalisation)', () => {
    function Stacked() {
      return (
        <SceneLayer>
          <Box key="a" id="a" x={10} y={20} width={100} height={50} style={{ zIndex: 1 }} data-testid="a" />
          <Box key="b" id="b" x={30} y={30} width={100} height={50} style={{ zIndex: 2 }} data-testid="b" />
        </SceneLayer>
      )
    }
    const step: Step<undefined> = { id: 's', era: 'e', title: 't', caption: 'c', Scene: Stacked, payload: undefined }
    render(<Presentation steps={[step]} title="t" />)
    const a = screen.getByTestId('a')
    const b = screen.getByTestId('b')
    expect([a.style.left, a.style.top, a.style.zIndex]).toEqual(['10px', '20px', '1'])
    expect([b.style.left, b.style.top, b.style.zIndex]).toEqual(['30px', '30px', '2'])
    // the boxes overlap and both are still rendered
    expect(a.parentElement).toBe(b.parentElement)
  })

  it('supports raw motion entities with a stable layoutId in a scene', () => {
    function Raw() {
      return <motion.div layoutId="raw-1" data-testid="raw" style={{ position: 'absolute', left: 3, top: 4 }} />
    }
    const step: Step<undefined> = { id: 's', era: 'e', title: 't', caption: 'c', Scene: Raw, payload: undefined }
    render(<Presentation steps={[step]} title="t" />)
    expect(screen.getByTestId('raw').style.left).toBe('3px')
  })
})
