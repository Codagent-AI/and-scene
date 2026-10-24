import { useContext, useEffect, useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { AnimatePresence } from 'motion/react'
import { Presentation } from '../Presentation'
import { Appear } from '../nodes/Appear'
import { Box } from '../nodes/Box'
import { SceneLayer } from '../nodes/SceneLayer'
import { ENTER_DELAY, LAYOUT_T } from '../constants'
import { StageContext } from '../stageContext'
import type { SceneProps, Step } from '../types'

afterEach(cleanup)

const next = () => fireEvent.keyDown(window, { key: 'ArrowRight' })

interface Payload {
  visible: string[]
}

let mounts = 0
function GroupScene({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    mounts++
  }, [])
  const [seen] = useState(() => mounts)
  return (
    <SceneLayer>
      <span data-testid="seen">{seen}</span>
      <AnimatePresence>
        {payload.visible.map((id) => (
          <Appear key={id}>
            <Box id={id} x={0} y={0}>
              {id}
            </Box>
          </Appear>
        ))}
      </AnimatePresence>
    </SceneLayer>
  )
}

function typedSteps(): Step<Payload>[] {
  const base = { era: 'e', caption: 'c', groupKey: 'g', Scene: GroupScene }
  return [
    { ...base, id: 'one', title: 'One', payload: { visible: ['a'] } },
    { ...base, id: 'two', title: 'Two', payload: { visible: ['a', 'b'] } },
    { ...base, id: 'three', title: 'Three', payload: { visible: ['b'] } },
  ]
}

const entity = (id: string) => document.querySelector(`[data-presentation-entity="${id}"]`)

describe('grouped scenes', () => {
  it('accepts a typed step array at the Presentation boundary without casts', () => {
    const steps: Step<Payload>[] = typedSteps()
    render(<Presentation steps={steps} />)
    expect(entity('a')).not.toBeNull()
  })

  it('keeps one scene instance across grouped steps and only changes the payload', () => {
    mounts = 0
    render(<Presentation steps={typedSteps()} />)
    expect(mounts).toBe(1)
    next()
    next()
    expect(mounts).toBe(1)
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
    expect(entity('b')).not.toBeNull()
  })

  it('does not remount continuing entities or re-wrap them as newcomers', () => {
    render(<Presentation steps={typedSteps()} />)
    const before = entity('a')
    const wrapper = before?.closest('[data-presentation-appear]')
    next()
    expect(entity('a')).toBe(before)
    expect(entity('a')?.closest('[data-presentation-appear]')).toBe(wrapper)
    expect(entity('b')?.closest('[data-presentation-appear]')).not.toBe(wrapper)
  })

  it('animates a departing entity out instead of removing it at once', async () => {
    render(<Presentation steps={typedSteps()} />)
    next()
    next()
    expect(entity('a')).not.toBeNull()
    await waitFor(() => expect(entity('a')).toBeNull())
    expect(entity('b')).not.toBeNull()
  })

  it('starts a newcomer hidden so it can enter after persisting entities settle', async () => {
    render(<Presentation steps={typedSteps()} />)
    await act(async () => next())
    const wrapper = entity('b')?.closest('[data-presentation-appear]') as HTMLElement
    expect(wrapper.style.opacity).toBe('0')
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })
})

describe('newcomer sequencing', () => {
  it('delays newcomers from the very first navigation, not only later ones', () => {
    const seen: boolean[] = []
    function Probe({ payload }: SceneProps<{ n: number }>) {
      const { hasNavigated } = useContext(StageContext)
      seen.push(hasNavigated)
      return <span data-testid={`probe-${payload.n}`} />
    }
    const steps: Step<{ n: number }>[] = [1, 2].map((n) => ({
      id: `probe-${n}`, era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene: Probe, payload: { n },
    }))
    render(<Presentation steps={steps} />)
    expect(seen.every((v) => !v)).toBe(true)
    seen.length = 0
    next()
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every(Boolean)).toBe(true)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })
})

describe('node primitives', () => {
  it('keep a stable entity identity hook and accept class, style, and state hooks', () => {
    render(
      <Box id="thing" x={10} y={20} width={30} height={40} className="mine" state="active" style={{ zIndex: 3 }}>
        hi
      </Box>,
    )
    const el = entity('thing') as HTMLElement
    expect(el.className).toBe('mine')
    expect(el.getAttribute('data-presentation-node')).toBe('box')
    expect(el.getAttribute('data-presentation-state')).toBe('active')
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('30px')
    expect(el.style.zIndex).toBe('3')
  })

  it('shares the same entity id across steps so the element can morph in place', () => {
    function Scene({ payload }: SceneProps<{ x: number }>) {
      return (
        <SceneLayer>
          <Box id="persist" x={payload.x} y={0} />
        </SceneLayer>
      )
    }
    const steps: Step<{ x: number }>[] = [0, 200].map((x, i) => ({
      id: `p${i}`, era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene, payload: { x },
    }))
    render(<Presentation steps={steps} />)
    const el = entity('persist') as HTMLElement
    expect(el.style.left).toBe('0px')
    next()
    expect(entity('persist')).toBe(el)
    expect(el.style.left).toBe('200px')
  })
})
