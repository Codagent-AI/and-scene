// @vitest-environment jsdom
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Appear, Box, Presentation, SceneLayer } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { appearMotion, entityTransition } from '../src/presentation-kit/nodes/transitions'

let container: HTMLDivElement
let root: Root

function coordinate(value: string) {
  return Number.parseFloat(value) || 0
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const { left, top, width, height } = this.style
    return new DOMRect(coordinate(left), coordinate(top), coordinate(width), coordinate(height))
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function render(node: ReactNode) {
  return act(() => root.render(node))
}

function next() {
  return act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
  })
}

function waitForAnimation(assertion: () => void) {
  return act(async () => {
    await vi.waitFor(assertion, { interval: 16, timeout: 1500 })
  })
}

function entity(id: string) {
  return container.querySelector<HTMLElement>(`[data-entity="${id}"]`)
}

const meta = { era: 'Testing transitions', title: 'Transition', caption: 'Follow the elements.' }

it('projects a shared identity between separate scene instances', async () => {
  const projection = vi.fn()
  function Origin() {
    return (
      <Box layoutId="unbroken" data-entity="origin" style={{ position: 'absolute', left: 10, width: 70, height: 50 }}>
        Old name
      </Box>
    )
  }
  function Destination() {
    return (
      <Box layoutId="unbroken" data-entity="destination" style={{ position: 'absolute', left: 130, width: 98, height: 60 }}
        onLayoutAnimationStart={projection}>
        New name
      </Box>
    )
  }
  const steps: Step[] = [
    { ...meta, id: 'source', Scene: Origin, payload: undefined },
    { ...meta, id: 'destination', Scene: Destination, payload: undefined },
  ]
  await render(<Presentation steps={steps} title="Fixture" />)
  expect(entity('origin')?.textContent).toBe('Old name')
  await next()
  const destination = entity('destination')
  expect(destination?.textContent).toBe('New name')
  expect([destination?.style.left, destination?.style.width]).toEqual(['130px', '98px'])
  await waitForAnimation(() => expect(projection).toHaveBeenCalledOnce())
  expect(destination?.style.transform).toContain('translate')
  expect(entity('origin')).not.toBeNull()
  expect(Number(destination?.style.opacity)).toBeLessThan(1)
})

it('delays newcomers until the layout settles, animates departures, and preserves continuing nodes', async () => {
  function Grouped({ payload }: SceneProps<boolean>) {
    return (
      <SceneLayer>
        <Box key="continuing" layoutId="continuing" data-entity="continuing"
          style={{ position: 'absolute', left: payload ? 120 : 10, width: 50, height: 30 }}>
          {payload ? 'Renamed' : 'Continuing'}
        </Box>
        {payload
          ? <Appear key="new" data-entity="new">New</Appear>
          : <Appear key="departing" data-entity="departing" initial={false}>Departing</Appear>}
      </SceneLayer>
    )
  }
  const steps: Step<boolean>[] = [
    { ...meta, id: 'before', Scene: Grouped, groupKey: 'group', payload: false },
    { ...meta, id: 'after', Scene: Grouped, groupKey: 'group', payload: true },
  ]
  await render(<Presentation steps={steps} title="Fixture" />)
  const continuing = entity('continuing')
  const departing = entity('departing')
  expect(departing?.style.opacity).toBe('1')

  await next()
  expect(entity('continuing')).toBe(continuing)
  expect(continuing?.textContent).toBe('Renamed')
  expect(continuing?.style.left).toBe('120px')
  expect(continuing?.closest('[data-presentation-appear]')).toBeNull()
  expect(entity('new')?.style.opacity).toBe('0')
  expect(entity('departing')).toBe(departing)
  expect(appearMotion.animate.transition.delay).toBeGreaterThanOrEqual(entityTransition.layout.duration)

  await waitForAnimation(() => {
    expect(Number(departing?.style.opacity)).toBeLessThan(1)
  })
  await waitForAnimation(() => expect(entity('new')?.style.opacity).toBe('1'))
  expect(entity('departing')).toBeNull()
  expect(entity('continuing')).toBe(continuing)
})
