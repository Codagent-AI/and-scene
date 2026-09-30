import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Sparkles } from 'lucide-react'
import { Box } from './Box'
import { Label } from './Label'
import { Arrow } from './Arrow'
import { Frame } from './Frame'
import { Emphasis } from './Emphasis'
import { SymbolChip } from './SymbolChip'
import { Appear } from './Appear'
import { SceneLayer } from './SceneLayer'

const VISUAL_STYLE_PROPS = ['color', 'backgroundColor', 'background', 'border', 'boxShadow', 'fontFamily']

function expectNoVisualDefaults(element: HTMLElement) {
  for (const prop of VISUAL_STYLE_PROPS) {
    expect(element.style[prop as never]).toBe('')
  }
}

describe('scene kit node primitives', () => {
  it('Box exposes a stable hook, layoutId, optional icon, and no visual defaults', () => {
    render(
      <Box layoutId="node-a" icon={Sparkles} data-testid="box">
        topic
      </Box>,
    )
    const box = screen.getByTestId('box')
    expect(box).toHaveAttribute('data-presentation-node', 'box')
    expect(box).toHaveTextContent('topic')
    expectNoVisualDefaults(box)
  })

  it('Label renders text with a stable hook and no visual defaults', () => {
    render(<Label data-testid="label">state</Label>)
    const label = screen.getByTestId('label')
    expect(label).toHaveAttribute('data-presentation-node', 'label')
    expect(label).toHaveTextContent('state')
    expectNoVisualDefaults(label)
  })

  it('Arrow exposes a stable hook and no visual defaults', () => {
    render(<Arrow data-testid="arrow" />)
    const arrow = screen.getByTestId('arrow')
    expect(arrow).toHaveAttribute('data-presentation-node', 'arrow')
    expectNoVisualDefaults(arrow)
  })

  it('Frame wraps children with a stable hook and no visual defaults', () => {
    render(
      <Frame data-testid="frame">
        <span>child</span>
      </Frame>,
    )
    const frame = screen.getByTestId('frame')
    expect(frame).toHaveAttribute('data-presentation-node', 'frame')
    expect(frame).toHaveTextContent('child')
    expectNoVisualDefaults(frame)
  })

  it('Emphasis exposes semantic active state via a stable hook', () => {
    const { rerender } = render(
      <Emphasis active data-testid="emphasis">
        thing
      </Emphasis>,
    )
    const emphasis = screen.getByTestId('emphasis')
    expect(emphasis).toHaveAttribute('data-presentation-node', 'emphasis')
    expect(emphasis).toHaveAttribute('data-presentation-active', 'true')
    expectNoVisualDefaults(emphasis)

    rerender(
      <Emphasis active={false} data-testid="emphasis">
        thing
      </Emphasis>,
    )
    expect(screen.getByTestId('emphasis')).toHaveAttribute('data-presentation-active', 'false')
  })

  it('SymbolChip composes an icon and label with a stable hook', () => {
    render(<SymbolChip layoutId="chip-a" icon={Sparkles} label="topic" data-testid="chip" />)
    const chip = screen.getByTestId('chip')
    expect(chip).toHaveAttribute('data-presentation-node', 'symbol-chip')
    expect(chip).toHaveTextContent('topic')
    expectNoVisualDefaults(chip)
  })

  it('SceneLayer absolutely positions content so mounting one layer never reflows another', () => {
    render(
      <SceneLayer data-testid="layer">
        <span>content</span>
      </SceneLayer>,
    )
    const layer = screen.getByTestId('layer')
    expect(layer).toHaveAttribute('data-presentation-node', 'scene-layer')
    expect(layer.style.position).toBe('absolute')
  })

  it('Appear delays mounting a newcomer until persisting entities settle', () => {
    vi.useFakeTimers()
    try {
      render(
        <Appear delayMs={500} data-testid="newcomer">
          <span>new entity</span>
        </Appear>,
      )
      expect(screen.queryByText('new entity')).not.toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(499)
      })
      expect(screen.queryByText('new entity')).not.toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.getByText('new entity')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
