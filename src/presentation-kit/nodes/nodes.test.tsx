import { render, waitFor } from '@testing-library/react'
import { Lightbulb } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '..'

const at = { x: 10, y: 20, w: 30, h: 40 }

describe('generic primitives', () => {
  const primitives = { box: Box, label: Label, frame: Frame, emphasis: Emphasis, 'symbol-chip': SymbolChip }

  for (const [kind, Node] of Object.entries(primitives)) {
    it(`${kind} exposes hooks and forwards class, style and data attributes`, () => {
      const { container } = render(
        <Node id="e1" at={at} z={3} className="mine" style={{ color: 'red' }} data-extra="yes">
          hello
        </Node>,
      )
      const el = container.firstElementChild as HTMLElement
      expect(el.dataset.presentationNode).toBe(kind)
      expect(el.dataset.presentationEntity).toBe('e1')
      expect(el.className).toBe('mine')
      expect(el.dataset.extra).toBe('yes')
      expect(el.textContent).toBe('hello')
      expect(el.style.left).toBe('10px')
      expect(el.style.top).toBe('20px')
      expect(el.style.width).toBe('30px')
      expect(el.style.height).toBe('40px')
      expect(el.style.zIndex).toBe('3')
      expect(el.style.color).toBe('red')
    })
  }

  it('without a position it adds no geometry', () => {
    const { container } = render(<Box id="plain">x</Box>)
    expect((container.firstElementChild as HTMLElement).getAttribute('style') ?? '').not.toMatch(/left|top|position/)
  })

  it('renders a Lucide icon glyph alongside caller content', () => {
    const { container } = render(
      <Box id="i" Icon={Lightbulb}>
        <span data-testid="c">content</span>
      </Box>,
    )
    expect(container.querySelector('svg[data-presentation-glyph]')).not.toBeNull()
    expect(container.querySelector('[data-testid="c"]')).not.toBeNull()
  })

  it('Arrow draws a line and head from canvas points, with a second head when two-way', () => {
    const one = render(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 100, y: 0 }} className="k" />)
    const el = one.container.firstElementChild as HTMLElement
    expect(el.dataset.presentationNode).toBe('arrow')
    expect(el.dataset.presentationEntity).toBe('a')
    expect(el.className).toBe('k')
    expect(el.querySelectorAll('[data-presentation-arrow-line]')).toHaveLength(1)
    expect(el.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(1)
    one.unmount()
    const two = render(<Arrow id="b" from={{ x: 0, y: 0 }} to={{ x: 0, y: 50 }} both />)
    expect(two.container.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
  })

  it('SceneLayer absolutely positions its layer', () => {
    const { container } = render(<SceneLayer z={2}>{null}</SceneLayer>)
    const layer = container.firstElementChild as HTMLElement
    expect(layer.dataset.presentationSceneLayer).toBe('')
    expect(layer.style.position).toBe('absolute')
    expect(layer.style.zIndex).toBe('2')
  })

  it('supports raw motion elements with a stable layoutId inside a layer', async () => {
    const { motion } = await import('motion/react')
    const { container } = render(
      <SceneLayer>
        <motion.div key="raw" layoutId="raw" data-presentation-entity="raw" style={{ position: 'absolute', left: 4 }} />
      </SceneLayer>,
    )
    expect(container.querySelector('[data-presentation-entity="raw"]')).not.toBeNull()
  })
})

describe('entity continuity in a persistent layer', () => {
  type Spec = { id: string; x: number }
  function Layer({ entities }: { entities: Spec[] }) {
    return (
      <SceneLayer>
        {entities.map((e) => (
          <Appear key={e.id}>
            <Box id={e.id} at={{ x: e.x, y: 0, w: 10, h: 10 }} />
          </Appear>
        ))}
      </SceneLayer>
    )
  }
  const entity = (c: HTMLElement, id: string) => c.querySelector(`[data-presentation-entity="${id}"]`) as HTMLElement | null

  it('keeps the persisting node and moves it in place', () => {
    const view = render(<Layer entities={[{ id: 'a', x: 0 }]} />)
    const node = entity(view.container, 'a')!
    view.rerender(<Layer entities={[{ id: 'a', x: 200 }]} />)
    expect(entity(view.container, 'a')).toBe(node)
    expect(node.style.left).toBe('200px')
  })

  it('adds newcomers without disturbing persisting entities', () => {
    const view = render(<Layer entities={[{ id: 'a', x: 0 }]} />)
    const node = entity(view.container, 'a')!
    const appear = node.closest('[data-presentation-appear]')!
    view.rerender(
      <Layer
        entities={[
          { id: 'a', x: 0 },
          { id: 'b', x: 50 },
        ]}
      />,
    )
    expect(entity(view.container, 'a')).toBe(node)
    expect(node.closest('[data-presentation-appear]')).toBe(appear)
    expect(entity(view.container, 'b')).not.toBeNull()
  })

  it('keeps a departing entity during its exit, then removes it', async () => {
    const view = render(
      <Layer
        entities={[
          { id: 'a', x: 0 },
          { id: 'b', x: 50 },
        ]}
      />,
    )
    view.rerender(<Layer entities={[{ id: 'a', x: 0 }]} />)
    expect(entity(view.container, 'b')).not.toBeNull()
    await waitFor(() => expect(entity(view.container, 'b')).toBeNull())
    expect(entity(view.container, 'a')).not.toBeNull()
  })
})

