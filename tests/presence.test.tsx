import { useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { act, render, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Stage } from '../src/presentation-kit/Stage'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { Box } from '../src/presentation-kit/nodes/Box'
import { ENTER_DELAY, LAYOUT_T } from '../src/presentation-kit/constants'
import type { SceneProps, Step } from '../src/presentation-kit/types'
const step = <T,>(Scene: Step<T>['Scene'], payload: T): Step<T> => ({ id: `beat-${String(payload)}`, era: 'era', title: 'Title', caption: 'Caption', groupKey: 'shared', Scene, payload })
it('I-5 an entity exits from a persisted Scene before removal and newcomers wait for layout', async () => {
  const sceneMounted = vi.fn(), sceneUnmounted = vi.fn()
  function Scene({ payload }: SceneProps<boolean>) {
    useEffect(() => { sceneMounted(); return sceneUnmounted }, [])
    return <AnimatePresence>{payload && <Appear key="departing" data-testid="departing" initial={false} transition={{ duration: 0.05, delay: 0 }}><Box identity="departing">Leaving</Box></Appear>}</AnimatePresence>
  }
  const { rerender, queryByTestId } = render(<Stage step={step(Scene, true)} index={0} mode="browse" />)
  const entity = queryByTestId('departing')!
  rerender(<Stage step={step(Scene, false)} index={1} mode="browse" />)
  expect(queryByTestId('departing')).toBe(entity)
  expect(sceneMounted).toHaveBeenCalledTimes(1)
  expect(sceneUnmounted).not.toHaveBeenCalled()
  await waitFor(() => expect(queryByTestId('departing')).toBeNull(), { timeout: 2000 })
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  expect(Appear({}).props.transition.delay).toBe(ENTER_DELAY)
})
it('I-6 continuing Appear entities retain instance without restarting entrance', async () => {
  const entrance = vi.fn(), mounted = vi.fn(), unmounted = vi.fn()
  function Scene({ payload }: SceneProps<number>) {
    useEffect(() => { mounted(); return unmounted }, [])
    return <AnimatePresence><Appear key="continuing" data-testid="continuing" transition={{ duration: 0.03, delay: 0 }} onAnimationStart={entrance}><Box identity="continuing">{payload}</Box></Appear></AnimatePresence>
  }
  const { rerender, getByTestId } = render(<Stage step={step(Scene, 0)} index={0} mode="browse" />)
  const entity = getByTestId('continuing')
  await waitFor(() => expect(entity.style.opacity).toBe('1'), { timeout: 2000 })
  const starts = entrance.mock.calls.length
  expect(starts).toBeGreaterThan(0)
  rerender(<Stage step={step(Scene, 1)} index={1} mode="browse" />)
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)) })
  expect(getByTestId('continuing')).toBe(entity)
  expect(entity.textContent).toBe('1')
  expect(entity.style.opacity).toBe('1')
  expect(entrance).toHaveBeenCalledTimes(starts)
  expect(mounted).toHaveBeenCalledTimes(1); expect(unmounted).not.toHaveBeenCalled()
})
it('I-6 same group with a different Scene cross-fades before unmounting the outgoing Scene', async () => {
  const unmounted = vi.fn()
  function First() { useEffect(() => unmounted, []); return <p data-testid="old">Old Scene</p> }
  function Second() { return <p data-testid="new">New Scene</p> }
  const { rerender, getByTestId, queryByTestId, container } = render(<Stage step={step(First, 0)} index={0} mode="browse" />)
  const outgoing = getByTestId('old')
  rerender(<Stage step={step(Second, 1)} index={1} mode="browse" />)
  expect(getByTestId('old')).toBe(outgoing)
  expect(getByTestId('new').closest<HTMLElement>('[data-presentation-scene]')?.style.opacity).toBe('0')
  expect(container.querySelectorAll('[data-presentation-scene]')).toHaveLength(2)
  expect(unmounted).not.toHaveBeenCalled()
  await waitFor(() => expect(queryByTestId('old')).toBeNull(), { timeout: 2000 })
  expect(unmounted).toHaveBeenCalledTimes(1)
  await waitFor(() => expect(getByTestId('new').closest<HTMLElement>('[data-presentation-scene]')?.style.opacity).toBe('1'))
  expect(container.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
})
