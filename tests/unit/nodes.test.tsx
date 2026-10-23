import { render, waitFor } from '@testing-library/react'
import { Check } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import {
  Appear,
  Arrow,
  Box,
  ENTER_DELAY,
  EXIT_T,
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

  it('fades newcomers in, after the layout move, but not continuing entities', async () => {
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
    const opacity = (id: string) =>
      container.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)!.style.opacity
    expect(opacity('continuing')).toBe('')
    expect(opacity('newcomer')).toBe('0')
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    // Still hidden while persisting entities are moving (the entry delay has not elapsed)...
    await new Promise((resolve) => setTimeout(resolve, ENTER_DELAY * 1000 * 0.4))
    expect(Number(opacity('newcomer'))).toBe(0)
    // ...and fully visible once the entry has run.
    await waitFor(() => expect(Number(opacity('newcomer'))).toBe(1), { timeout: 3000 })
  })

  it('animates a departing entity out before removing it', async () => {
    const { container, rerender } = render(
      <SceneLayer>
        <Box key="a" id="a">a</Box>
        <Box key="b" id="b">b</Box>
      </SceneLayer>,
    )
    const find = (id: string) => container.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)
    const departing = find('b')!
    const removedAfter = { at: 0 }
    const started = performance.now()
    rerender(
      <SceneLayer>
        <Box key="a" id="a">a</Box>
      </SceneLayer>,
    )
    // The exit animation keeps the node mounted for a moment instead of dropping it at once.
    expect(find('b')).toBe(departing)
    const seen: number[] = []
    await waitFor(
      () => {
        const el = find('b')
        if (el) seen.push(Number(el.style.opacity === '' ? 1 : el.style.opacity))
        removedAfter.at = performance.now() - started
        expect(el).toBeNull()
      },
      { timeout: 3000, interval: 10 },
    )
    expect(removedAfter.at).toBeGreaterThanOrEqual(EXIT_T * 1000 * 0.5)
    expect(Math.min(...seen)).toBeLessThan(1)
    expect(find('a')).not.toBeNull()
  })

  it('animates a persisting arrow between geometries instead of snapping', async () => {
    const pathOf = (container: HTMLElement) =>
      container.querySelector('[data-presentation-arrow-svg] > path')!.getAttribute('d')!
    const { container, rerender } = render(
      <SceneLayer>
        <Arrow key="arrow" id="arrow" from={[0, 0]} to={[100, 0]} />
      </SceneLayer>,
    )
    const before = pathOf(container)
    expect(before).toBe('M0 0 Q50 0 100 0')
    rerender(
      <SceneLayer>
        <Arrow key="arrow" id="arrow" from={[0, 0]} to={[100, 100]} via={[100, 0]} />
      </SceneLayer>,
    )
    const target = 'M0 0 Q100 0 100 100'
    const seen = new Set<string>()
    await waitFor(
      () => {
        seen.add(pathOf(container))
        expect(pathOf(container)).toBe(target)
      },
      { timeout: 3000, interval: 10 },
    )
    // At least one in-between shape was rendered on the way.
    expect([...seen].filter((d) => d !== before && d !== target).length).toBeGreaterThan(0)
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
