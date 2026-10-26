import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sparkles } from 'lucide-react'
import { Appear } from './Appear'
import { Arrow } from './Arrow'
import { Box } from './Box'
import { Emphasis } from './Emphasis'
import { Frame } from './Frame'
import { Label } from './Label'
import { SceneLayer } from './SceneLayer'
import { SymbolChip } from './SymbolChip'

describe('style ownership boundary', () => {
  it('Box exposes a stable hook, forwards className, and sets no default className', () => {
    render(
      <Box layoutId="topic" data-testid="box">
        content
      </Box>,
    )
    const el = screen.getByTestId('box')
    expect(el).toHaveAttribute('data-presentation-box', '')
    expect(el.className).toBe('')
    expect(el).not.toHaveAttribute('style')
  })

  it('Box forwards a caller-supplied className and renders an optional icon', () => {
    render(
      <Box layoutId="topic" className="my-box" Icon={Sparkles} data-testid="box">
        content
      </Box>,
    )
    const el = screen.getByTestId('box')
    expect(el).toHaveClass('my-box')
    expect(el.querySelector('[data-presentation-box-icon]')).not.toBeNull()
  })

  it('Label exposes a stable hook with no default className', () => {
    render(<Label data-testid="label">hello</Label>)
    const el = screen.getByTestId('label')
    expect(el).toHaveAttribute('data-presentation-label', '')
    expect(el.className).toBe('')
  })

  it('Arrow exposes a stable hook with no default className', () => {
    render(<Arrow layoutId="arrow-1" data-testid="arrow" />)
    const el = screen.getByTestId('arrow')
    expect(el).toHaveAttribute('data-presentation-arrow', '')
    expect(el.className).toBe('')
  })

  it('Frame exposes a stable hook and renders children with no default className', () => {
    render(
      <Frame data-testid="frame">
        <span>child</span>
      </Frame>,
    )
    const el = screen.getByTestId('frame')
    expect(el).toHaveAttribute('data-presentation-frame', '')
    expect(el.className).toBe('')
    expect(el.textContent).toBe('child')
  })

  it('Emphasis exposes a stable hook and reflects the active prop with no default className', () => {
    const { rerender } = render(<Emphasis active data-testid="emphasis">note</Emphasis>)
    const el = screen.getByTestId('emphasis')
    expect(el).toHaveAttribute('data-presentation-emphasis', '')
    expect(el).toHaveAttribute('data-active', 'true')
    expect(el.className).toBe('')

    rerender(<Emphasis active={false} data-testid="emphasis">note</Emphasis>)
    expect(el).toHaveAttribute('data-active', 'false')
  })

  it('SymbolChip exposes a stable hook, renders a label and optional icon with no default className', () => {
    render(<SymbolChip layoutId="chip-1" label="Tools" Icon={Sparkles} data-testid="chip" />)
    const el = screen.getByTestId('chip')
    expect(el).toHaveAttribute('data-presentation-symbol-chip', '')
    expect(el.className).toBe('')
    expect(el).toHaveTextContent('Tools')
    expect(el.querySelector('[data-presentation-symbol-chip-icon]')).not.toBeNull()
  })

  it('Appear exposes a stable hook and renders its children', () => {
    render(
      <Appear data-testid="appear">
        <span>newcomer</span>
      </Appear>,
    )
    const el = screen.getByTestId('appear')
    expect(el).toHaveAttribute('data-presentation-appear', '')
    expect(el.className).toBe('')
    expect(el.textContent).toBe('newcomer')
  })

  it('SceneLayer exposes a stable hook and absolutely positions its content as layout geometry, not visual styling', () => {
    render(
      <SceneLayer data-testid="layer">
        <span>diagram</span>
      </SceneLayer>,
    )
    const el = screen.getByTestId('layer')
    expect(el).toHaveAttribute('data-presentation-scene-layer', '')
    expect(el.className).toBe('')
    expect(el.style.position).toBe('absolute')
    expect(el.style.inset).toBe('0px')
    expect(el.style.color).toBe('')
    expect(el.style.background).toBe('')
  })
})
