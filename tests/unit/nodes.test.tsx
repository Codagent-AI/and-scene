import { describe, expect, it } from 'vitest'
import { Check } from 'lucide-react'
import { act, render } from '@testing-library/react'
import { LayoutGroupContext, motion } from 'motion/react'
import { useContext } from 'react'
import {
  Appear, Arrow, Box, Emphasis, Frame, Label, Presentation, SceneLayer, SymbolChip,
  type SceneProps, type Step,
} from '../../src/presentation-kit'
import { EASE, LAYOUT_T } from '../../src/presentation-kit'
import { useEntityProps } from '../../src/presentation-kit/nodes/entity'
import { renderHook } from '@testing-library/react'
import { press, setViewport } from './helpers'

const NODES = [
  ['box', 'Box', (p: object) => <Box id="n" {...p} />],
  ['label', 'Label', (p: object) => <Label id="n" {...p} />],
  ['frame', 'Frame', (p: object) => <Frame id="n" {...p} />],
  ['emphasis', 'Emphasis', (p: object) => <Emphasis id="n" {...p} />],
  ['symbol-chip', 'SymbolChip', (p: object) => <SymbolChip id="n" {...p} />],
  ['arrow', 'Arrow', (p: object) => <Arrow id="n" from={[10, 10]} to={[90, 40]} {...p} />],
] as const

describe.each(NODES)('%s primitive', (kind, _name, make) => {
  const mount = (props: object = {}) => {
    const { container } = render(<div>{make(props)}</div>)
    return container.querySelector<HTMLElement>('[data-presentation-entity]')!
  }

  it('exposes stable identity and kind hooks', () => {
    const el = mount()
    expect(el.getAttribute('data-presentation-entity')).toBe('n')
    expect(el.getAttribute('data-presentation-node')).toBe(kind)
  })

  it('forwards className, style and custom data attributes', () => {
    const el = mount({ className: 'mine', style: { opacity: 0.5, zIndex: 3 }, 'data-extra': 'yes' })
    expect(el.classList.contains('mine')).toBe(true)
    expect(el.getAttribute('data-extra')).toBe('yes')
    expect(el.style.zIndex).toBe('3')
    expect(el.getAttribute('data-presentation-entity')).toBe('n') // built-in hook retained
  })

  it('applies literal canvas geometry', () => {
    if (kind === 'arrow') return
    const el = mount({ x: 12, y: 34, w: 56, h: 78 })
    expect([el.style.left, el.style.top, el.style.width, el.style.height, el.style.position]).toEqual(
      ['12px', '34px', '56px', '78px', 'absolute'],
    )
  })

  it('does not add any colour, font, border or shadow of its own', () => {
    const el = mount()
    for (const prop of ['color', 'background', 'font', 'border', 'boxShadow', 'outline', 'borderRadius']) {
      expect((el.style as unknown as Record<string, string>)[prop] ?? '').toBe('')
    }
  })
})

describe('primitive specifics', () => {
  it('Box works with and without a Lucide glyph', () => {
    const plain = render(<Box id="a">text</Box>).container
    expect(plain.querySelector('[data-presentation-glyph]')).toBeNull()
    const glyph = render(<Box id="b" Icon={Check}>text</Box>).container
    expect(glyph.querySelector('svg[data-presentation-glyph]')).not.toBeNull()
  })

  it('Emphasis marks itself as emphasised; Box emphasis is opt-in', () => {
    const { container } = render(<><Emphasis id="e" /><Box id="b" emphasis /><Box id="c" /></>)
    const get = (id: string) => container.querySelector(`[data-presentation-entity="${id}"]`)!
    expect(get('e').getAttribute('data-presentation-emphasis')).toBe('true')
    expect(get('b').getAttribute('data-presentation-emphasis')).toBe('true')
    expect(get('c').hasAttribute('data-presentation-emphasis')).toBe(false)
  })

  it('SymbolChip exposes its symbol and prefers children', () => {
    const { container } = render(<><SymbolChip id="s" symbol="Σ" /><SymbolChip id="t" symbol="Σ">custom</SymbolChip></>)
    expect(container.querySelector('[data-presentation-entity="s"]')!.textContent).toBe('Σ')
    expect(container.querySelector('[data-presentation-entity="t"]')!.textContent).toBe('custom')
    expect(container.querySelector('[data-presentation-entity="s"]')!.getAttribute('data-presentation-symbol')).toBe('Σ')
  })

  it('Arrow draws stroke-only lines (shaft + heads) and supports two-way', () => {
    const one = render(<Arrow id="a" from={[0, 0]} to={[100, 0]} />).container
    expect(one.querySelectorAll('[data-presentation-arrow-shaft]')).toHaveLength(1)
    expect(one.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
    const two = render(<Arrow id="b" from={[0, 0]} to={[100, 0]} bidirectional />).container
    expect(two.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(4)
    for (const line of two.querySelectorAll('line')) {
      expect(line.hasAttribute('stroke')).toBe(false)
      expect(line.hasAttribute('fill')).toBe(false)
    }
  })

  it('Appear and SceneLayer keep their hooks', () => {
    const { container } = render(<SceneLayer><Appear id="z">x</Appear></SceneLayer>)
    expect(container.querySelector('[data-presentation-scene-layer]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-appear="z"]')).not.toBeNull()
  })
})

describe('coordinate-heavy diagrams', () => {
  type P = { x: number }
  const contexts: unknown[] = []
  function Probe() {
    contexts.push(useContext(LayoutGroupContext))
    return null
  }
  function Mixed({ payload }: SceneProps<P>) {
    return (
      <SceneLayer>
        <Probe key="probe" />
        <Box key="box" id="box" x={payload.x} y={0} w={10} h={10} className="primitive" />
        <motion.div
          key="raw"
          layoutId="raw"
          data-presentation-entity="raw"
          className="raw"
          style={{ position: 'absolute', left: payload.x * 2, top: 50 }}
        />
      </SceneLayer>
    )
  }
  const steps: Step<P>[] = [1, 2].map((n) => ({
    id: `m${n}`, era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene: Mixed, payload: { x: n * 10 },
  }))

  it('lets raw motion elements with layoutId live beside primitives in one stage', () => {
    setViewport(1280, 800)
    render(<Presentation steps={steps} title="deck" />)
    const stage = document.querySelector('[data-presentation-stage]')!
    const raw = stage.querySelector<HTMLElement>('[data-presentation-entity="raw"]')!
    const box = stage.querySelector<HTMLElement>('[data-presentation-entity="box"]')!
    expect(document.querySelectorAll('[data-presentation-stage]')).toHaveLength(1)
    expect([raw.style.left, box.style.left]).toEqual(['20px', '10px'])
    act(() => void press('ArrowRight'))
    expect(stage.querySelector('[data-presentation-entity="raw"]')).toBe(raw)
    expect(stage.querySelector('[data-presentation-entity="box"]')).toBe(box)
    expect([raw.style.left, box.style.left]).toEqual(['40px', '20px'])
    expect(raw.classList.contains('raw')).toBe(true)
  })

  it('shares one layout-projection group between raw elements and primitives', () => {
    contexts.length = 0
    setViewport(1280, 800)
    render(<Presentation steps={steps} title="deck" />)
    act(() => void press('ArrowRight'))
    const [first, ...rest] = contexts
    expect(first).toBeTruthy()
    expect(rest.every((c) => c === first)).toBe(true)
  })
})

describe('layout morph wiring', () => {
  it('gives every entity its id as layoutId and a layout transition matching LAYOUT_T', () => {
    const { result } = renderHook(() => useEntityProps({ id: 'thing', kind: 'box', x: 1, y: 2 }))
    expect(result.current.layoutId).toBe('thing')
    expect(result.current.transition).toEqual({ layout: { duration: LAYOUT_T, ease: EASE } })
    expect(result.current['data-presentation-entity']).toBe('thing')
  })
})
