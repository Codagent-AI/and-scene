import type { ReactElement } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { Stage } from './Stage'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Appear } from './nodes/Appear'
import { Arrow } from './nodes/Arrow'
import { Box } from './nodes/Box'
import { Emphasis } from './nodes/Emphasis'
import { Frame } from './nodes/Frame'
import { Label } from './nodes/Label'
import { SceneLayer } from './nodes/SceneLayer'
import { SymbolChip } from './nodes/SymbolChip'
import { IconBox, PlainBox } from './__fixtures__/box-with-icon'
import type { Step } from './types'

afterEach(() => cleanup())

const noop = () => {}
const stepFixture: Step<undefined> = {
  id: 'only',
  era: 'Only',
  title: 'Only',
  caption: 'Only caption.',
  payload: undefined,
  Scene: () => null,
}

interface Case {
  name: string
  /** Stable kit hook the element must keep. */
  stable: string
  element: ReactElement
  /** Element that carries the supplied class, style and data hook. */
  selector: string
}

// Every primitive and chrome part: supplied class, style and data hook reach the intended element,
// and the stable kit hook is still present.
const cases: Case[] = [
  {
    name: 'Box',
    stable: 'data-presentation-node',
    selector: '[data-presentation-node="box"]',
    element: <Box id="box-1" x={5} y={6} w={7} h={8} label="L" className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
  {
    name: 'Label',
    stable: 'data-presentation-node',
    selector: '[data-presentation-node="label"]',
    element: <Label id="label-1" x={5} y={6} w={7} h={8} className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x">hi</Label>,
  },
  {
    name: 'Arrow',
    stable: 'data-presentation-node',
    selector: '[data-presentation-node="arrow"]',
    element: <Arrow id="arrow-1" from={[0, 0]} to={[40, 0]} className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
  {
    name: 'Frame',
    stable: 'data-presentation-node',
    selector: '[data-presentation-node="frame"]',
    element: <Frame id="frame-1" x={5} y={6} w={7} h={8} className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
  {
    name: 'Emphasis',
    stable: 'data-presentation-emphasis',
    selector: '[data-presentation-node="emphasis"]',
    element: <Emphasis id="emph-1" x={5} y={6} w={7} h={8} className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
  {
    name: 'SymbolChip',
    stable: 'data-presentation-node',
    selector: '[data-presentation-node="symbol-chip"]',
    element: <SymbolChip id="chip-1" x={5} y={6} w={7} h={8} symbol="*" className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
  {
    name: 'Appear',
    stable: 'data-presentation-appear',
    selector: '[data-presentation-appear]',
    element: <Appear className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x"><span>child</span></Appear>,
  },
  {
    name: 'SceneLayer',
    stable: 'data-presentation-layer',
    selector: '[data-presentation-layer]',
    element: <SceneLayer className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
  {
    name: 'Stage',
    stable: 'data-presentation-stage',
    selector: '[data-presentation-stage]',
    element: <Stage step={stepFixture} index={0} scale={1} mode="browse" className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
  {
    name: 'Presentation',
    stable: 'data-presentation-root',
    selector: '[data-presentation-root]',
    element: <Presentation steps={[stepFixture]} title="Deck" className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
  {
    name: 'Header',
    stable: 'data-presentation-header',
    selector: '[data-presentation-header]',
    element: <Header mode="browse" marker="1 / 1" title="Deck" onToggleMode={noop} className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
  {
    name: 'Footer',
    stable: 'data-presentation-footer',
    selector: '[data-presentation-footer]',
    element: (
      <Footer
        mode="browse"
        steps={[stepFixture]}
        index={0}
        attribution={null}
        onGoTo={noop}
        onPrev={noop}
        onNext={noop}
        className="kit-x"
        style={{ marginTop: '7px' }}
        data-test-hook="x"
      />
    ),
  },
  {
    name: 'Toc',
    stable: 'data-presentation-toc',
    selector: '[data-presentation-toc]',
    element: <Toc entries={[{ era: 'Only', firstIndex: 0 }]} activeEra="Only" onGoTo={noop} className="kit-x" style={{ marginTop: '7px' }} data-test-hook="x" />,
  },
]

describe('Kit primitives expose style hooks', () => {
  it.each(cases)('$name keeps its stable hook and passes class, style and data hooks to its element', ({ stable, selector, element }) => {
    const { container } = render(element)
    const el = container.querySelector(selector) as HTMLElement | null
    expect(el).not.toBeNull()
    expect(el?.hasAttribute(stable)).toBe(true)
    expect(el?.classList.contains('kit-x')).toBe(true)
    expect(el?.style.marginTop).toBe('7px')
    expect(el?.getAttribute('data-test-hook')).toBe('x')
  })

  it.each([
    ['Box', <Box key="g" id="g" x={5} y={6} w={7} h={8} data-test-hook="x" />, '[data-presentation-node="box"]'],
    ['Frame', <Frame key="g" id="g" x={5} y={6} w={7} h={8} data-test-hook="x" />, '[data-presentation-node="frame"]'],
    ['Label', <Label key="g" id="g" x={5} y={6} w={7} h={8} data-test-hook="x" />, '[data-presentation-node="label"]'],
  ])('%s keeps geometry and identity when hooks are supplied', (_name, element, selector) => {
    const { container } = render(element)
    const el = container.querySelector(selector) as HTMLElement
    expect(el.style.left).toBe('5px')
    expect(el.style.top).toBe('6px')
    expect(el.style.width).toBe('7px')
    expect(el.style.height).toBe('8px')
    expect(el.getAttribute('data-presentation-id')).toBe('g')
  })

  it('does not let a supplied data hook override a stable kit hook', () => {
    const { container } = render(<Box id="b" data-presentation-node="spoofed" />)
    expect(container.querySelector('[data-presentation-node="box"]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-node="spoofed"]')).toBeNull()
  })
})

describe('Coordinate-heavy layer composition', () => {
  function Overlap({ caption }: { caption: string }) {
    return (
      <SceneLayer>
        <Box key="under" id="under" x={10} y={10} w={100} h={100} label={caption} />
        <Box key="over" id="over" x={60} y={60} w={100} h={100} label="over" />
      </SceneLayer>
    )
  }

  it('absolutely positions the layer, keeps explicit overlapping coordinates, and keeps child order', () => {
    const { container, rerender } = render(<Overlap caption="first" />)
    const layer = container.querySelector('[data-presentation-layer]') as HTMLElement
    expect(layer.style.position).toBe('absolute')
    expect(layer.style.inset).toBe('0px')
    expect(layer.style.zIndex).toBe('')
    expect(layer.style.transform).toBe('')

    const under = container.querySelector('[data-presentation-id="under"]') as HTMLElement
    const over = container.querySelector('[data-presentation-id="over"]') as HTMLElement
    expect(under.style.left).toBe('10px')
    expect(under.style.top).toBe('10px')
    expect(over.style.left).toBe('60px')
    expect(over.style.top).toBe('60px')
    // The rectangles overlap (x 60..110, y 60..110) and nothing reflows them.
    expect(under.style.zIndex).toBe('')
    expect(over.style.zIndex).toBe('')
    expect(under.compareDocumentPosition(over) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    rerender(<Overlap caption="second" />)
    expect(container.querySelector('[data-presentation-id="under"]')).toBe(under)
    expect(container.querySelector('[data-presentation-id="over"]')).toBe(over)
    expect(under.style.left).toBe('10px')
    expect(over.style.top).toBe('60px')
    expect(under.compareDocumentPosition(over) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(under.querySelector('[data-presentation-label]')?.textContent).toBe('second')
  })
})

describe('Generic primitive with optional icon (Decision 7)', () => {
  it('renders the supplied Lucide glyph and keeps identity and hooks', () => {
    const { container } = render(<IconBox />)
    const el = container.querySelector('[data-presentation-id="starred"]') as HTMLElement
    expect(el.getAttribute('data-presentation-node')).toBe('box')
    const glyph = el.querySelector('svg[data-presentation-icon]')
    expect(glyph).not.toBeNull()
    expect(glyph?.getAttribute('aria-hidden')).toBe('true')
    expect(glyph?.getAttribute('class')).toContain('lucide-star')
  })

  it('adds neither a glyph nor any kit visual default when no icon is given', () => {
    const { container } = render(<PlainBox />)
    const el = container.querySelector('[data-presentation-id="plain"]') as HTMLElement
    expect(el.getAttribute('data-presentation-node')).toBe('box')
    expect(el.querySelector('svg')).toBeNull()
    expect(el.childElementCount).toBe(0)
    expect(el.getAttribute('class')).toBeNull()
  })

  it.each(['starred', 'plain'])('%s carries only geometry in its inline style', (id) => {
    const { container } = render(id === 'starred' ? <IconBox /> : <PlainBox />)
    const el = container.querySelector(`[data-presentation-id="${id}"]`) as HTMLElement
    expect(Array.from(el.style).sort()).toEqual(['height', 'left', 'position', 'top', 'width'])
  })
})
