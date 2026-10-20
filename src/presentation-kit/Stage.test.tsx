import { act, render, waitFor } from '@testing-library/react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Box } from './nodes/Box.tsx'
import { Appear } from './nodes/Appear.tsx'
import { SceneLayer } from './nodes/SceneLayer.tsx'
import { Presentation } from './Presentation.tsx'
import { key, setViewport } from './testing.tsx'
import type { SceneProps, Step } from './types.ts'

const q = (selector: string) => document.querySelector<HTMLElement>(selector)

let instances = 0
const log = { mounts: 0, unmounts: 0, payloads: [] as number[] }
function Counting({ payload }: SceneProps<{ n: number }>) {
  const [instance] = useState(() => ++instances)
  useEffect(() => {
    log.mounts++
    return () => void log.unmounts++
  }, [])
  log.payloads.push(payload.n)
  return <div data-testid="counting" data-state={instance} />
}
function Other({ payload }: SceneProps<{ n: number }>) {
  return <div data-testid="other">{payload.n}</div>
}

const meta = (i: number) => ({ id: `s${i}`, era: 'e', title: `T${i}`, caption: `C${i}` })
const resetLog = () => Object.assign(log, { mounts: 0, unmounts: 0, payloads: [] })

describe('grouped scenes', () => {
  it('keeps one scene instance across steps of a group, updating only the payload', () => {
    resetLog()
    const steps: Step<{ n: number }>[] = [0, 1, 2].map((n) => ({ ...meta(n), groupKey: 'g', Scene: Counting, payload: { n } }))
    render(<Presentation steps={steps} />)
    const initial = log.mounts
    const state = q('[data-testid=counting]')!.getAttribute('data-state')
    key('ArrowRight')
    key('ArrowRight')
    expect(document.querySelectorAll('[data-testid=counting]')).toHaveLength(1)
    expect(q('[data-testid=counting]')!.getAttribute('data-state')).toBe(state)
    expect(log.mounts).toBe(initial)
    expect(log.unmounts).toBe(0)
    expect(log.payloads).toContain(2)
    key('ArrowLeft')
    expect(log.payloads.at(-1)).toBe(1)
    expect(q('[data-testid=counting]')!.getAttribute('data-state')).toBe(state)
  })

  it('replaces the instance when the group changes, the Scene changes, or steps are ungrouped', async () => {
    resetLog()
    const steps: Step<{ n: number }>[] = [
      { ...meta(0), groupKey: 'a', Scene: Counting, payload: { n: 0 } },
      { ...meta(1), groupKey: 'b', Scene: Counting, payload: { n: 1 } },
      { ...meta(2), groupKey: 'b', Scene: Other, payload: { n: 2 } },
      { ...meta(3), Scene: Counting, payload: { n: 3 } },
      { ...meta(4), Scene: Counting, payload: { n: 4 } },
    ]
    render(<Presentation steps={steps} />)
    const states: Array<string | null> = []
    const seen = () => states.push(q('[data-testid=counting]')?.getAttribute('data-state') ?? null)
    seen()
    key('ArrowRight') // different group
    await waitFor(() => expect(document.querySelectorAll('[data-testid=counting]')).toHaveLength(1))
    seen()
    expect(states[1]).not.toBe(states[0])
    key('ArrowRight') // same group, different Scene
    await waitFor(() => expect(q('[data-testid=other]')).not.toBeNull())
    await waitFor(() => expect(q('[data-testid=counting]')).toBeNull())
    key('ArrowRight') // other -> ungrouped
    await waitFor(() => expect(q('[data-testid=counting]')).not.toBeNull())
    await waitFor(() => expect(q('[data-testid=other]')).toBeNull())
    seen()
    key('ArrowRight') // ungrouped -> distinct ungrouped
    await waitFor(() => expect(document.querySelectorAll('[data-testid=counting]')).toHaveLength(1))
    seen()
    expect(states[3]).not.toBe(states[2])
  })
})

describe('separate scenes', () => {
  it('keeps the previous scene until its exit completes when the group changes, then removes it', async () => {
    const steps: Step<{ n: number }>[] = [
      { ...meta(0), groupKey: 'a', Scene: Counting, payload: { n: 0 } },
      { ...meta(1), groupKey: 'b', Scene: Other, payload: { n: 1 } },
    ]
    render(<Presentation steps={steps} />)
    key('ArrowRight')
    expect(q('[data-testid=other]')).not.toBeNull()
    expect(q('[data-testid=counting]')).not.toBeNull()
    await waitFor(() => expect(q('[data-testid=counting]')).toBeNull())
  })
})

describe('entities', () => {
  function Scene({ payload }: SceneProps<{ ids: string[] }>) {
    return (
      <SceneLayer>
        {payload.ids.map((id) => (
          <Appear key={id}>
            <Box id={id} data-testid={id} />
          </Appear>
        ))}
      </SceneLayer>
    )
  }
  const steps: Step<{ ids: string[] }>[] = [
    { ...meta(0), groupKey: 'g', Scene, payload: { ids: ['a', 'b'] } },
    { ...meta(1), groupKey: 'g', Scene, payload: { ids: ['a', 'c'] } },
  ]

  it('keeps continuing entities mounted (same DOM node) while others enter and exit', async () => {
    render(<Presentation steps={steps} />)
    const a = q('[data-testid=a]')!
    const b = q('[data-testid=b]')!
    key('ArrowRight')
    expect(q('[data-testid=a]')).toBe(a)
    expect(q('[data-testid=c]')).not.toBeNull()
    expect(q('[data-testid=b]')).toBe(b) // still present while exiting
    await waitFor(() => expect(q('[data-testid=b]')).toBeNull())
    expect(q('[data-testid=a]')).toBe(a)
  })

  it('retains departing entities until their exit completes, then removes them', async () => {
    render(<Presentation steps={steps} />)
    key('ArrowRight')
    expect(q('[data-testid=b]')).not.toBeNull()
    await waitFor(() => expect(q('[data-testid=b]')).toBeNull())
  })
})

describe('stage geometry', () => {
  const steps: Step[] = [
    { ...meta(0), Scene: () => <div /> },
    { ...meta(1), Scene: () => <div style={{ width: 800 }}>dense</div> },
  ]
  const canvas = () => q('[data-presentation-canvas]')!

  it('uses an 880 × 380 canvas by default and scales it uniformly on resize', () => {
    setViewport(1440, 900)
    render(<Presentation steps={steps} initialMode="present" />)
    expect(canvas().style.width).toBe('880px')
    expect(canvas().style.height).toBe('380px')
    const big = Number(canvas().getAttribute('data-presentation-scale'))
    expect(canvas().style.transform).toMatch(/^translate\(-50%, -50%\) scale\(/)
    expect(parseFloat(canvas().style.transform.split('scale(')[1])).toBeCloseTo(big, 3)
    setViewport(700, 600)
    const small = Number(canvas().getAttribute('data-presentation-scale'))
    expect(small).toBeLessThan(big)
    expect(canvas().style.width).toBe('880px')
    expect(canvas().style.height).toBe('380px')
  })

  it('supports an overridden design canvas', () => {
    setViewport(1440, 900)
    const view = render(<Presentation steps={steps} initialMode="present" />)
    const dflt = Number(canvas().getAttribute('data-presentation-scale'))
    view.rerender(<Presentation steps={steps} initialMode="present" design={{ width: 1760, height: 760 }} />)
    expect(canvas().style.width).toBe('1760px')
    expect(Number(canvas().getAttribute('data-presentation-scale'))).toBeCloseTo(dflt / 2, 3)
  })

  it('keeps the scale independent of step content within a mode, and changes geometry across modes', () => {
    setViewport(1440, 900)
    render(<Presentation steps={steps} initialMode="present" />)
    const first = canvas().getAttribute('data-presentation-scale')
    key('ArrowRight')
    expect(canvas().getAttribute('data-presentation-scale')).toBe(first)
    key('p')
    expect(canvas().getAttribute('data-presentation-scale')).not.toBe(first)
  })

  it('remounts the scene on a mode switch instead of morphing it', () => {
    setViewport(1440, 900)
    const mounts = { n: 0 }
    function Mounted() {
      useEffect(() => void mounts.n++, [])
      return <div />
    }
    render(<Presentation steps={[{ ...meta(0), Scene: Mounted }]} initialMode="present" />)
    const before = mounts.n
    act(() => key('p'))
    expect(mounts.n).toBeGreaterThan(before)
  })

  it('lets scenes use raw motion elements with their own layoutIds next to primitives', () => {
    function Raw() {
      return (
        <SceneLayer>
          <Box id="p" rect={{ x: 10, y: 20, w: 30, h: 40 }} />
          <motion.div layoutId="raw" data-testid="raw" style={{ position: 'absolute', left: 5, top: 6 }} />
        </SceneLayer>
      )
    }
    render(<Presentation steps={[{ ...meta(0), Scene: Raw }]} />)
    expect(q('[data-testid=raw]')!.style.left).toBe('5px')
    const box = q('[data-presentation-entity=p]')!
    expect([box.style.left, box.style.top, box.style.width, box.style.height]).toEqual(['10px', '20px', '30px', '40px'])
  })

  it('positions each scene layer absolutely so mounting one never reflows another', () => {
    function Two() {
      return (
        <>
          <SceneLayer>
            <Box id="one" rect={{ x: 1, y: 2, w: 3, h: 4 }} />
          </SceneLayer>
          <SceneLayer>
            <Box id="two" rect={{ x: 5, y: 6, w: 7, h: 8 }} />
          </SceneLayer>
        </>
      )
    }
    render(<Presentation steps={[{ ...meta(0), Scene: Two }]} />)
    const layers = [...document.querySelectorAll<HTMLElement>('[data-presentation-layer]')]
    expect(layers).toHaveLength(2)
    for (const layer of layers) {
      expect(layer.style.position).toBe('absolute')
      expect(layer.style.inset).toMatch(/^0(px)?( 0(px)?){0,3}$/)
    }
    expect(q('[data-presentation-entity=one]')!.style.left).toBe('1px')
  })
})
