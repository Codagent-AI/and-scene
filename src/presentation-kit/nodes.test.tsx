import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { Circle } from 'lucide-react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import * as kit from './index'
import { Entity } from './nodes/Entity'
import { Box } from './nodes/Box'
import { Label } from './nodes/Label'
import { Frame } from './nodes/Frame'
import { Emphasis } from './nodes/Emphasis'
import { SymbolChip } from './nodes/SymbolChip'
import { Arrow } from './nodes/Arrow'
import { Appear } from './nodes/Appear'
import { SceneLayer } from './nodes/SceneLayer'
import { Stage } from './Stage'
import { Presentation } from './Presentation'
import type { SceneProps, Step, StepMeta } from './types'
import { motion } from 'motion/react'

// Records the props each motion element receives, so layoutId and layout wiring can be asserted in jsdom.
const captured = vi.hoisted(() => ({ motion: [] as Array<{ tag: string; props: Record<string, unknown> }> }))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  const React = await import('react')
  const cache = new Map<string, unknown>()
  const wrapped = new Proxy(actual.motion, {
    get(target, tag) {
      if (typeof tag !== 'string') return Reflect.get(target, tag)
      if (!cache.has(tag)) {
        const Real = Reflect.get(target, tag) as React.ElementType
        cache.set(
          tag,
          React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
            captured.motion.push({ tag, props })
            return React.createElement(Real, { ...props, ref })
          }),
        )
      }
      return cache.get(tag)
    },
  })
  return { ...actual, motion: wrapped }
})

afterEach(cleanup)
beforeEach(() => {
  captured.motion.length = 0
})

function lastMotionProps(entityId: string): Record<string, unknown> | undefined {
  return captured.motion.filter((c) => c.props['data-presentation-entity'] === entityId).at(-1)?.props
}

describe('node primitives: stable hooks and passthrough (L-7)', () => {
  it('Entity exposes entity, kind and emphasis hooks and passes className and style through', () => {
    const style: CSSProperties = { backgroundColor: 'rgb(1, 2, 3)' }
    const { container } = render(
      <Entity id="e1" x={10} y={20} w={30} h={40} className="consumer" emphasis style={style}>
        <i>child</i>
      </Entity>,
    )
    const el = container.querySelector('[data-presentation-entity="e1"]') as HTMLElement
    expect(el.getAttribute('data-presentation-kind')).toBe('entity')
    expect(el.getAttribute('data-presentation-emphasis')).toBe('true')
    expect(el.classList.contains('consumer')).toBe(true)
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('30px')
    expect(el.style.height).toBe('40px')
    expect(el.style.position).toBe('absolute')
    expect(el.style.backgroundColor).toBe('rgb(1, 2, 3)')
    expect(el.querySelector('i')?.textContent).toBe('child')
  })

  it('Box, Frame, Label, Emphasis and SymbolChip each expose their documented kind hook', () => {
    const { container } = render(
      <>
        <Box id="box" x={0} y={0} label="Box label" className="c-box" style={{ zIndex: 2 }}>
          body
        </Box>
        <Frame id="frame" x={0} y={0} label="Frame label" className="c-frame" />
        <Label id="label" x={0} y={0} className="c-label" />
        <Emphasis id="emph" x={0} y={0} className="c-emph" />
        <SymbolChip id="chip" x={0} y={0} symbol="$" className="c-chip" />
      </>,
    )
    const kindOf = (id: string) => container.querySelector(`[data-presentation-entity="${id}"]`)
    expect(kindOf('box')?.getAttribute('data-presentation-kind')).toBe('box')
    expect(kindOf('frame')?.getAttribute('data-presentation-kind')).toBe('frame')
    expect(kindOf('label')?.getAttribute('data-presentation-kind')).toBe('label')
    expect(kindOf('emph')?.getAttribute('data-presentation-kind')).toBe('emphasis')
    expect(kindOf('emph')?.getAttribute('data-presentation-emphasis')).toBe('true')
    expect(kindOf('chip')?.getAttribute('data-presentation-kind')).toBe('symbol-chip')
    expect((kindOf('box') as HTMLElement).style.zIndex).toBe('2')
    expect(kindOf('box')?.querySelector('[data-presentation-label]')?.textContent).toBe('Box label')
    expect(kindOf('frame')?.querySelector('[data-presentation-label]')?.textContent).toBe('Frame label')
    expect(kindOf('chip')?.querySelector('[data-presentation-symbol]')?.textContent).toBe('$')
    expect(kindOf('box')?.classList.contains('c-box')).toBe(true)
    expect(kindOf('frame')?.classList.contains('c-frame')).toBe(true)
    expect(kindOf('label')?.classList.contains('c-label')).toBe(true)
    expect(kindOf('emph')?.classList.contains('c-emph')).toBe(true)
    expect(kindOf('chip')?.classList.contains('c-chip')).toBe(true)
  })

  it('Arrow exposes arrow hooks, two-way and emphasis markers, and className and style passthrough', () => {
    const { container } = render(
      <svg>
        <Arrow id="arr" from={[0, 0]} to={[100, 0]} twoWay emphasis className="c-arrow" style={{ transform: 'translateX(4px)' }} />
      </svg>,
    )
    const arrow = container.querySelector('[data-presentation-entity="arr"]') as unknown as SVGElement
    expect(arrow.getAttribute('data-presentation-kind')).toBe('arrow')
    expect(arrow.getAttribute('data-presentation-two-way')).toBe('true')
    expect(arrow.getAttribute('data-presentation-emphasis')).toBe('true')
    expect(arrow.getAttribute('class')).toContain('c-arrow')
    expect(arrow.getAttribute('style')).toContain('translateX(4px)')
    expect(arrow.querySelectorAll('polyline')).toHaveLength(2)
  })

  it('Appear and SceneLayer expose their hooks and pass className and style through', () => {
    const { container } = render(
      <>
        <Appear>
          <span>newcomer</span>
        </Appear>
        <SceneLayer className="layer-a" style={{ zIndex: 3 }}>
          <span>layer</span>
        </SceneLayer>
      </>,
    )
    expect(container.querySelector('[data-presentation-appear]')?.textContent).toBe('newcomer')
    const layer = container.querySelector('[data-presentation-scene-layer]') as HTMLElement
    expect(layer.classList.contains('layer-a')).toBe(true)
    expect(layer.style.zIndex).toBe('3')
    expect(layer.style.position).toBe('absolute')
  })

  it('layoutId and layout reach Motion, not just a DOM attribute', () => {
    render(
      <>
        <Entity id="layout-entity" x={0} y={0} />
        <Box id="layout-box" x={0} y={0} />
      </>,
    )
    const entityProps = lastMotionProps('layout-entity')
    expect(entityProps?.layoutId).toBe('layout-entity')
    expect(entityProps?.layout).toBe(true)
    expect(lastMotionProps('layout-box')?.layoutId).toBe('layout-box')
    expect(lastMotionProps('layout-box')?.layout).toBe(true)
    const attrs = render(<Entity id="attr-check" x={0} y={0} />).container.innerHTML
    expect(attrs).not.toContain('layoutid')
  })

  it('Presentation renders every chrome hook in present and browse modes', () => {
    const StubScene: ComponentType<SceneProps> = () => null
    const meta = (id: string): StepMeta => ({ id, era: 'era', title: `T ${id}`, caption: `C ${id}` })
    const steps: Step[] = [
      { ...meta('one'), Scene: StubScene, payload: undefined },
      { ...meta('two'), Scene: StubScene, payload: undefined },
    ]
    const present = render(<Presentation steps={steps} title="deck" initialMode="present" />).container
    const presentRoot = present.querySelector('[data-presentation-root]') as HTMLElement
    expect(presentRoot.getAttribute('data-presentation-mode')).toBe('present')
    expect(presentRoot.getAttribute('data-presentation-step-count')).toBe('2')
    expect(presentRoot.getAttribute('data-step-count')).toBe('2')
    expect(presentRoot.getAttribute('data-presentation-step-index')).toBe('0')
    expect(presentRoot.getAttribute('data-step-index')).toBe('0')
    expect(present.querySelector('[data-presentation-header]')).not.toBeNull()
    expect(present.querySelector('[data-presentation-marker]')?.textContent).toBe('1')
    expect(present.querySelector('footer [data-presentation-title]')?.textContent).toBe('T one')
    expect(present.querySelector('[data-presentation-stage]')).not.toBeNull()
    expect(present.querySelector('[data-presentation-progress]')).toBeNull()
    cleanup()

    const browse = render(<Presentation steps={steps} title="deck" initialMode="browse" />).container
    const browseRoot = browse.querySelector('[data-presentation-root]') as HTMLElement
    expect(browseRoot.getAttribute('data-presentation-mode')).toBe('browse')
    expect(browse.querySelector('[data-presentation-caption]')?.textContent).toBe('C one')
    expect(browse.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(2)
    expect(browse.querySelector('[data-presentation-progress-item][data-presentation-active="true"]')?.getAttribute('data-presentation-progress-index')).toBe('0')
    expect(browse.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(browse.querySelector('[data-presentation-toc-item]')).not.toBeNull()
    expect(browse.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(browse.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(browse.querySelector('[data-presentation-mode-toggle]')).not.toBeNull()
    fireEvent.click(browse.querySelector('[data-presentation-mode-toggle]') as HTMLElement)
    expect(browse.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('present')
  })
})

describe('kit exports the generic primitive set (C-5)', () => {
  it('exports Box, Label, Arrow, Frame, Emphasis, SymbolChip, Entity, Appear and SceneLayer', () => {
    for (const name of ['Box', 'Label', 'Arrow', 'Frame', 'Emphasis', 'SymbolChip', 'Entity', 'Appear', 'SceneLayer']) {
      expect(typeof kit[name as keyof typeof kit], name).toBe('function')
    }
  })

  it('Box renders the supplied Lucide glyph and adds no glyph when none is supplied', () => {
    const withIcon = render(<Box id="with-icon" x={0} y={0} Icon={Circle} label="Icon" />).container
    const iconSvg = withIcon.querySelector('[data-presentation-icon]')
    expect(iconSvg).not.toBeNull()
    expect(iconSvg?.tagName.toLowerCase()).toBe('svg')
    expect(iconSvg?.classList.contains('lucide-circle')).toBe(true)
    cleanup()

    const without = render(<Box id="no-icon" x={0} y={0} label="Plain" />).container
    expect(without.querySelector('[data-presentation-icon]')).toBeNull()
    expect(without.querySelector('svg')).toBeNull()
    expect(without.querySelector('[data-presentation-label]')?.textContent).toBe('Plain')
  })

  it('imports no sample entities or topic-specific modules into the kit', () => {
    const sources = import.meta.glob('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })
    const kitFiles = Object.entries(sources).filter(([key]) => !/\.test\.tsx?$/.test(key))
    expect(kitFiles.length).toBeGreaterThan(10)
    const offenders = kitFiles
      .filter(([, text]) => /from ['"][^'"]*(presentations|how-to-make|outline)[^'"]*['"]/.test(text))
      .map(([key]) => key)
    expect(offenders).toEqual([])
  })
})

describe('chrome brand and attribution (L-9, L-10)', () => {
  const StubScene: ComponentType<SceneProps> = () => null
  const steps: Step[] = [{ id: 'only', era: 'era', title: 'Only', caption: 'Caption', Scene: StubScene, payload: undefined }]

  it('shows the default bottom-right attribution linking to the and-scene repository', () => {
    const { container } = render(<Presentation steps={steps} title="deck" />)
    const link = container.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.style.position).toBe('absolute')
    expect(link.style.right).toBe('0px')
    expect(link.style.bottom).toBe('0px')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('replaces the attribution with a configured override and removes it for null', () => {
    const { container, unmount } = render(
      <Presentation steps={steps} title="deck" attribution={{ label: 'Host credit', href: 'https://example.com/host' }} />,
    )
    const link = container.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('Host credit')
    expect(link.getAttribute('href')).toBe('https://example.com/host')
    expect(container.textContent).not.toContain('made by and-scene')
    unmount()

    const none = render(<Presentation steps={steps} title="deck" attribution={null} />).container
    expect(none.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('renders no default brand in the header, and renders a supplied host brand in the header slot', () => {
    const { container, unmount } = render(<Presentation steps={steps} title="deck" />)
    const slot = container.querySelector('header [data-presentation-brand]') as HTMLElement
    expect(slot).not.toBeNull()
    expect(slot.childNodes).toHaveLength(0)
    expect(container.querySelector('header [data-presentation-attribution]')).toBeNull()
    unmount()

    const { container: branded } = render(
      <Presentation steps={steps} title="deck" brand={<span data-testid="host-brand">Acme Co</span>} />,
    )
    const brandedSlot = branded.querySelector('header [data-presentation-brand]') as HTMLElement
    expect(brandedSlot.querySelector('[data-testid="host-brand"]')?.textContent).toBe('Acme Co')
  })
})

describe('raw motion elements under Stage (L-7)', () => {
  it('keeps a raw motion element and a primitive sharing identity across payload changes', () => {
    const meta: StepMeta = { id: 'raw', era: 'era', title: 'Raw', caption: 'Raw caption' }
    interface P {
      x: number
    }
    const Scene: ComponentType<SceneProps<P>> = ({ payload }): ReactNode => (
      <>
        <motion.div layoutId="raw-shared" data-testid="raw" style={{ position: 'absolute', left: payload.x }} />
        <Entity id="prim" x={payload.x} y={0} />
      </>
    )
    const step = (x: number): Step<P> => ({ ...meta, groupKey: 'raw', Scene, payload: { x } })
    const { container, rerender, getByTestId } = render(<Stage step={step(10)} index={0} mode="present" />)
    const raw1 = getByTestId('raw')
    const prim1 = container.querySelector('[data-presentation-entity="prim"]')
    rerender(<Stage step={step(200)} index={0} mode="present" />)
    expect(getByTestId('raw')).toBe(raw1)
    expect(container.querySelector('[data-presentation-entity="prim"]')).toBe(prim1)
    expect((getByTestId('raw') as HTMLElement).style.left).toBe('200px')
    expect(captured.motion.filter((c) => c.props['data-testid'] === 'raw').at(-1)?.props.layoutId).toBe('raw-shared')
  })
})
