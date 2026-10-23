import { render, waitFor } from '@testing-library/react'
import { Check } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import {
  Appear,
  Arrow,
  Box,
  ENTER_DELAY,
  Emphasis,
  Frame,
  LAYOUT_T,
  Label,
  SceneLayer,
  SymbolChip,
} from '../../src/presentation-kit'

describe('node primitives', () => {
  it('expose stable identity hooks, class and style passthrough, and no own visual style', () => {
    const { container } = render(
      <SceneLayer>
        <Box id="b" x={5} y={6} width={70} height={30} className="mine" style={{ opacity: 0.9 }}>
          text
        </Box>
        <Label id="l">label</Label>
        <SymbolChip id="c" Icon={Check}>
          ok
        </SymbolChip>
        <Frame id="f" />
        <Emphasis id="e" />
        <Arrow id="a" from={[0, 0]} to={[10, 10]} className="line" />
      </SceneLayer>,
    )
    const ids = [...container.querySelectorAll('[data-presentation-entity]')].map((el) =>
      el.getAttribute('data-presentation-entity'),
    )
    expect(ids).toEqual(['b', 'l', 'c', 'f', 'e', 'a'])
    const box = container.querySelector<HTMLElement>('[data-presentation-entity="b"]')!
    expect(box.className).toBe('mine')
    expect(box.dataset.presentationKind).toBe('box')
    expect(box.style.left).toBe('5px')
    expect(box.style.width).toBe('70px')
    expect(box.style.opacity).toBe('0.9')
    for (const prop of ['color', 'backgroundColor', 'borderTopWidth', 'boxShadow', 'fontFamily']) {
      expect(box.style[prop as 'color']).toBe('')
    }
    expect(container.querySelector('[data-presentation-glyph]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-arrow-svg] > path')!.getAttribute('stroke')).toBe(
      'currentColor',
    )
  })

  it('supports raw coordinates through x/y without requiring a primitive shape', () => {
    const { container } = render(
      <SceneLayer>
        <Label id="p" x={100} y={50}>
          raw
        </Label>
      </SceneLayer>,
    )
    const el = container.querySelector<HTMLElement>('[data-presentation-entity="p"]')!
    expect(el.style.position).toBe('absolute')
    expect(el.style.top).toBe('50px')
  })

  it('fades newcomers in, after the layout move, but not continuing entities', () => {
    const { container, rerender } = render(
      <SceneLayer>
        <Box key="continuing" id="continuing">stay</Box>
      </SceneLayer>,
    )
    rerender(
      <SceneLayer>
        <Box key="continuing" id="continuing">stay</Box>
        <Appear key="newcomer" id="newcomer">new</Appear>
      </SceneLayer>,
    )
    expect(container.querySelector<HTMLElement>('[data-presentation-entity="continuing"]')!.style.opacity).toBe('')
    expect(container.querySelector<HTMLElement>('[data-presentation-entity="newcomer"]')!.style.opacity).toBe('0')
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('animates a departing entity out and removes it', async () => {
    const { container, rerender } = render(
      <SceneLayer>
        <Box key="a" id="a">a</Box>
        <Box key="b" id="b">b</Box>
      </SceneLayer>,
    )
    rerender(
      <SceneLayer>
        <Box key="a" id="a">a</Box>
      </SceneLayer>,
    )
    await waitFor(() => expect(container.querySelector('[data-presentation-entity="b"]')).toBeNull(), {
      timeout: 3000,
    })
    expect(container.querySelector('[data-presentation-entity="a"]')).not.toBeNull()
  })

  it('marks intentional overlap regions with a hook', () => {
    const { container } = render(
      <SceneLayer>
        <Box id="o" allowOverlap>
          x
        </Box>
      </SceneLayer>,
    )
    expect(container.querySelector('[data-presentation-allow-overlap]')).not.toBeNull()
  })
})
