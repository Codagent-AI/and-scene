import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, Presentation, SceneLayer, SymbolChip } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { ENTER_DELAY, LAYOUT_T } from '../src/presentation-kit/constants'
import { assertStyleNeutralSource, structuralStyles } from './style-contract.mjs'

vi.mock('motion/react', async importOriginal => {
  const original = await importOriginal<typeof import('motion/react')>()
  const { forwardRef } = await import('react')
  const div = forwardRef<HTMLDivElement, import('motion/react').HTMLMotionProps<'div'>>((props, ref) => (
    <original.motion.div {...props} ref={ref}
      data-test-motion-layout={props.layout ? 'enabled' : undefined}
      data-test-motion-id={props.layoutId}
      data-test-motion-animate={typeof props.animate === 'object' ? JSON.stringify(props.animate) : undefined}
      data-test-motion-exit={typeof props.exit === 'object' ? JSON.stringify(props.exit) : undefined} />
  ))
  return {
    ...original,
    motion: new Proxy(original.motion, {
      get: (motion, key) => key === 'div' ? div : Reflect.get(motion, key),
    }),
  }
})

function Group({ payload }: SceneProps<boolean>) {
  return (
    <SceneLayer>
      <Label key="persist" id="persist" label={payload ? 'Updated anchor' : 'Anchor'}
        style={{ position: 'absolute', top: 15, left: payload ? 80 : 20, width: payload ? 180 : 140 }}
        animate={{ opacity: payload ? 1 : 0.7 }} />
      {payload
        ? <Appear key="new" className="newcomer" style={{ position: 'absolute', top: 15, left: 120 }}>
          <Box id="new">New note</Box>
        </Appear>
        : <Box key="departing" id="departing" style={{ position: 'absolute', top: 15, left: 60 }}>To be removed</Box>}
    </SceneLayer>
  )
}

function Other() {
  return <SceneLayer><Box id="persist">Different scene with shared ID</Box></SceneLayer>
}

const common = { era: 'Era', title: 'Title', caption: 'Caption', groupKey: 'shared' }
const steps: Step<boolean>[] = [
  { ...common, id: 'first', payload: false, Scene: Group },
  { ...common, id: 'second', payload: true, Scene: Group },
  { ...common, id: 'third', payload: true, Scene: Other },
]

test('grouped scene preserves entities and stacking, schedules entry and animates departures', async () => {
  const { container } = render(<Presentation title="Transitions" steps={steps} />)
  const hook = (selector: string) => container.querySelector<HTMLElement>(selector)
  const scene = hook('[data-presentation-scene]')
  const continuing = hook('[data-presentation-entity="persist"]')!
  const departing = hook('[data-presentation-entity="departing"]')!
  expect(continuing.getAttribute('data-test-motion-id')).toBe('persist')
  expect(continuing.getAttribute('data-test-motion-layout')).toBe('enabled')
  expect(continuing.style.left).toBe('20px')
  expect(continuing.style.width).toBe('140px')
  expect(continuing.getAttribute('data-test-motion-animate')).toBe('{"opacity":0.7}')
  expect(departing.getAttribute('data-test-motion-exit')).toBe('{"opacity":0}')

  fireEvent.keyDown(document, { key: 'ArrowRight' })
  expect(hook('[data-presentation-scene]')).toBe(scene)
  expect(hook('[data-presentation-entity="persist"]')).toBe(continuing)
  expect(continuing.closest('[data-presentation-appear]')).toBeNull()
  expect(continuing.getAttribute('data-test-motion-animate')).toBe('{"opacity":1}')
  expect(continuing.style.left).toBe('80px')
  expect(continuing.style.width).toBe('180px')
  expect(screen.getByText('Updated anchor')).toBeTruthy()
  expect(continuing.style.top).toBe('15px')

  const newcomer = hook('[data-presentation-appear]')!
  expect(newcomer.style.top).toBe('15px')
  expect(newcomer.style.left).toBe('120px')
  expect(JSON.parse(newcomer.getAttribute('data-test-motion-animate')!).transition.delay).toBe(ENTER_DELAY)
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  expect(hook('[data-presentation-entity="departing"]')).toBe(departing)
  await waitFor(() => expect(hook('[data-presentation-entity="departing"]')).toBeNull())

  fireEvent.keyDown(document, { key: 'ArrowRight' })
  const other = screen.getByText('Different scene with shared ID')
  expect(other.closest('[data-presentation-scene]')).not.toBe(scene)
  expect(other.getAttribute('data-test-motion-id')).toBe('persist')
  await waitFor(() => expect(scene!.isConnected).toBe(false))
})

const primitives = [
  ['arrow', Arrow], ['box', Box], ['emphasis', Emphasis], ['frame', Frame],
  ['label', Label], ['symbol-chip', SymbolChip],
] as const

test('all node primitives pass through author hooks and literal coordinates', () => {
  const { container } = render(
    <SceneLayer className="author-layer" data-presentation-example="layer" style={{ width: 250 }}>
      <Appear className="author-entry" data-presentation-example="entry" style={{ top: 5 }}>
        {primitives.map(([kind, Primitive]) => (
          <Primitive key={kind} id={`stable-${kind}`} className="author-node"
            style={{ position: 'absolute', top: 20, left: 42, color: 'rebeccapurple' }}
            data-presentation-example={kind}>Author content</Primitive>
        ))}
      </Appear>
    </SceneLayer>,
  )

  for (const [kind] of primitives) {
    const node = container.querySelector<HTMLElement>(`[data-presentation-node="${kind}"]`)!
    expect(node.className).toBe('author-node')
    expect(node.getAttribute('data-presentation-example')).toBe(kind)
    expect(node.getAttribute('data-presentation-entity')).toBe(`stable-${kind}`)
    expect(node.style.left).toBe('42px')
    expect(node.style.top).toBe('20px')
    expect(node.style.color).toBe('rebeccapurple')
  }
  const layer = container.querySelector<HTMLElement>('[data-presentation-layer]')!
  expect(layer.className).toBe('author-layer')
  expect(layer.getAttribute('data-presentation-example')).toBe('layer')
  expect(layer.style.width).toBe('250px')
  const entry = container.querySelector<HTMLElement>('[data-presentation-appear]')!
  expect(entry.className).toBe('author-entry')
  expect(entry.getAttribute('data-presentation-example')).toBe('entry')
  expect(entry.style.top).toBe('5px')
})

function UnstyledDiagram() {
  return <SceneLayer><Appear>
    {primitives.map(([kind, Primitive]) => <Primitive key={kind} id={kind}>{kind}</Primitive>)}
  </Appear></SceneLayer>
}

test('unstyled presentation chrome and every node supply only geometry and motion styles', () => {
  const unstyled = [{ id: 'one', era: 'Intro', title: 'First', caption: 'Caption', Scene: UnstyledDiagram }]
  const { container } = render(<Presentation title="Unstyled" steps={unstyled} />)

  const hooks = [
    'header', 'marker', 'title', 'body', 'toc', 'era', 'stage', 'canvas', 'scene', 'footer', 'caption',
    'navigation', 'previous', 'progress', 'progress-step', 'next', 'attribution', 'layer', 'appear',
  ]
  for (const hook of hooks) {
    expect(container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
  }
  expect([...container.querySelectorAll('[data-presentation-node]')].map(node => node.getAttribute('data-presentation-node')))
    .toEqual(primitives.map(([kind]) => kind))

  // The CSSOM expands white-space's shorthand and Motion supplies opacity.
  const allowed = new Set([...structuralStyles, 'whiteSpaceCollapse', 'whiteSpaceTrim', 'textWrapMode', 'opacity']
    .map(key => key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)))
  const unexpected = [...container.querySelectorAll<HTMLElement>('*')].flatMap(node =>
    Array.from(node.style).filter(property => !allowed.has(property)).map(property => `${node.tagName}: ${property}`),
  )
  expect(unexpected).toEqual([])
})

test.each(['color', 'fontFamily', 'border', 'boxShadow', 'background', 'padding', "'--theme'"])(
  'style contract rejects the inline visual default %s',
  property => expect(() => assertStyleNeutralSource('Fixture.tsx', `const node = <div style={{ ${property}: 'value' }} />`))
    .toThrow('visual inline default'),
)

test('style contract rejects embedded and imported presentation styles', () => {
  expect(() => assertStyleNeutralSource('Fixture.tsx', 'const node = <style>{css}</style>')).toThrow('embedded CSS')
  expect(() => assertStyleNeutralSource('Fixture.tsx', "import './theme.css'")).toThrow('unexpected stylesheet')
})
