import { render, screen, waitFor } from '@testing-library/react'
import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation.tsx'
import { sceneKey } from './sceneKey.ts'
import { Appear } from './nodes/Appear.tsx'
import { Arrow } from './nodes/Arrow.tsx'
import { Box } from './nodes/Box.tsx'
import { Emphasis } from './nodes/Emphasis.tsx'
import { Frame } from './nodes/Frame.tsx'
import { Label } from './nodes/Label.tsx'
import { SceneLayer } from './nodes/SceneLayer.tsx'
import { SymbolChip } from './nodes/SymbolChip.tsx'
import type { AnyStep, SceneProps, Step } from './types.ts'
import { fireEvent } from '@testing-library/react'

let mounts = 0
function Grouped({ payload }: SceneProps<{ label: string }>) {
  useEffect(() => {
    mounts++
  }, [])
  return <div data-testid="grouped">{payload.label}</div>
}
function Other() {
  return <div data-testid="other">other</div>
}

const grouped = (id: string, label: string): Step<{ label: string }> => ({
  id,
  era: 'e',
  title: id,
  caption: id,
  Scene: Grouped,
  groupKey: 'g',
  payload: { label },
})
const other: AnyStep = { id: 'o', era: 'e', title: 'o', caption: 'o', Scene: Other, payload: undefined }

describe('grouped scenes', () => {
  it('shares one key for steps with the same groupKey and Scene', () => {
    expect(sceneKey(grouped('a', 'A'))).toBe(sceneKey(grouped('b', 'B')))
    expect(sceneKey(grouped('a', 'A'))).not.toBe(sceneKey(other))
    expect(sceneKey({ ...grouped('a', 'A'), Scene: Other })).not.toBe(sceneKey(grouped('a', 'A')))
  })

  it('updates the existing scene instance in place instead of remounting', () => {
    mounts = 0
    render(<Presentation steps={[grouped('a', 'first'), grouped('b', 'second'), grouped('c', 'third')]} title="T" />)
    const node = screen.getByTestId('grouped')
    expect(node.textContent).toBe('first')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getAllByTestId('grouped')).toHaveLength(1)
    expect(screen.getByTestId('grouped')).toBe(node)
    expect(node.textContent).toBe('third')
    expect(mounts).toBe(1)
  })

  it('replaces the scene when the next step is not in the group', async () => {
    render(<Presentation steps={[grouped('a', 'first'), other]} title="T" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getByTestId('other')).toBeTruthy())
  })
})

describe('Appear', () => {
  it('fades newcomers in after persisting entities settle', () => {
    render(<Appear id="n" enter>x</Appear>)
    const el = screen.getByText('x')
    expect(el.getAttribute('data-presentation-enter')).toBe('true')
    expect(el.style.opacity).toBe('0')
  })

  it('does not apply newcomer fade to continuing entities', () => {
    render(<Appear id="c" enter={false}>x</Appear>)
    const el = screen.getByText('x')
    expect(el.getAttribute('data-presentation-enter')).toBe('false')
    expect(el.style.opacity).toBe('')
  })

  it('toggling enter keeps the same DOM node (no remount)', () => {
    const { rerender } = render(<Appear id="c" enter>x</Appear>)
    const el = screen.getByText('x')
    rerender(<Appear id="c" enter={false}>x</Appear>)
    expect(screen.getByText('x')).toBe(el)
  })

  it('keeps a departing entity until its exit animation ends, then removes it', async () => {
    const Host = ({ show }: { show: boolean }) => (
      <AnimatePresence>{show ? <Appear key="k" id="k" enter={false}>bye</Appear> : null}</AnimatePresence>
    )
    const { rerender } = render(<Host show />)
    rerender(<Host show={false} />)
    expect(screen.queryByText('bye')).not.toBeNull()
    await waitFor(() => expect(screen.queryByText('bye')).toBeNull(), { timeout: 3000 })
  })

  it('continues to exist across a state change of the host (identity persists)', () => {
    function Host() {
      const [n, setN] = useState(0)
      return (
        <>
          <button onClick={() => setN(n + 1)}>go</button>
          <Box id="persist" at={{ x: n * 10, y: 0, w: 10, h: 10 }}>b</Box>
        </>
      )
    }
    render(<Host />)
    const box = screen.getByText('b')
    fireEvent.click(screen.getByText('go'))
    expect(screen.getByText('b')).toBe(box)
    expect(box.style.left).toBe('10px')
  })
})

describe('node primitives', () => {
  it('expose entity hooks and pass class, data, and style through', () => {
    render(
      <div>
        <Box id="b" className="k" data-extra="1" at={{ x: 1, y: 2, w: 3, h: 4 }}>box</Box>
        <Label id="l" className="k">label</Label>
        <Frame id="f" className="k" />
        <Emphasis id="e" className="k" />
        <SymbolChip id="s" className="k" tone="warm">chip</SymbolChip>
        <Arrow id="a" className="k" from={{ x: 0, y: 0 }} to={{ x: 10, y: 10 }} bidirectional />
        <SceneLayer className="k" />
      </div>,
    )
    const kinds = [...document.querySelectorAll('[data-presentation-node]')].map((n) => n.getAttribute('data-presentation-node'))
    expect(kinds).toEqual(['box', 'label', 'frame', 'emphasis', 'symbol-chip', 'arrow'])
    const box = screen.getByText('box')
    expect(box.getAttribute('data-presentation-entity')).toBe('b')
    expect(box.className).toBe('k')
    expect(box.getAttribute('data-extra')).toBe('1')
    expect(box.style.left).toBe('1px')
    expect(box.style.width).toBe('3px')
    expect(screen.getByText('chip').getAttribute('data-tone')).toBe('warm')
    expect(document.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(1)
    expect(document.querySelector('[data-presentation-layer]')).not.toBeNull()
  })

  it('marks allowOverlap subtrees with the allow-overlap hook', () => {
    render(<Box id="b" allowOverlap>x</Box>)
    expect(screen.getByText('x').hasAttribute('data-presentation-allow-overlap')).toBe(true)
  })

  it('accepts raw positioning without any kit-imposed visual style', () => {
    render(<Box id="plain">p</Box>)
    const style = screen.getByText('p').getAttribute('style') ?? ''
    expect(style).not.toMatch(/color|background|border|font|shadow/i)
  })
})
