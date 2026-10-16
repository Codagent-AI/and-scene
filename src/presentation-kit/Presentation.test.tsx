// @vitest-environment jsdom
import { useEffect, useRef } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from 'motion/react'
import { Box, Presentation, SceneLayer, defineStep, type SceneProps } from './index.ts'

let mounts = 0
function CountingScene({ payload }: SceneProps<{ beat: number }>) {
  const counted = useRef(false)
  useEffect(() => {
    if (!counted.current) {
      counted.current = true
      mounts += 1
    }
  }, [])
  return (
    <SceneLayer>
      <Box id="persisting" at={{ x: 0, y: 0, w: 10, h: 10 }}>beat {payload.beat}</Box>
    </SceneLayer>
  )
}
const Other = () => <SceneLayer><Box id="other">other</Box></SceneLayer>

const steps = [
  defineStep({ id: 's1', era: 'ask', title: 'Title 1', caption: 'Caption 1', Scene: CountingScene, groupKey: 'g', payload: { beat: 1 } }),
  defineStep({ id: 's2', era: 'ask', title: 'Title 2', caption: 'Caption 2', Scene: CountingScene, groupKey: 'g', payload: { beat: 2 } }),
  defineStep({ id: 's3', era: 'build', title: 'Title 3', caption: 'Caption 3', Scene: Other, payload: undefined }),
]

const root = () => document.querySelector('[data-presentation-root]')!
const index = () => Number(root().getAttribute('data-step-index'))
const press = (key: string) => fireEvent.keyDown(window, { key })

afterEach(() => {
  cleanup()
  mounts = 0
})

describe('<Presentation>', () => {
  it('exposes step hooks and starts in the declared mode', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(root().getAttribute('data-step-count')).toBe('3')
    expect(index()).toBe(0)
    expect(root().getAttribute('data-mode')).toBe('present')
  })

  it('present mode shows marker and title only; browse shows caption, ToC, controls, and progress', () => {
    const { unmount } = render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('01 / 03')
    expect(document.querySelector('[data-presentation-title]')?.textContent).toBe('Title 1')
    for (const hidden of ['caption', 'toc', 'prev', 'next', 'progress']) {
      expect(document.querySelector(`[data-presentation-${hidden}]`)).toBeNull()
    }
    unmount()
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption 1')
    for (const shown of ['toc', 'prev', 'next', 'progress']) {
      expect(document.querySelector(`[data-presentation-${shown}]`)).not.toBeNull()
    }
    expect(document.querySelectorAll('[data-presentation-dot]')).toHaveLength(3)
  })

  it('navigates by keyboard, clamps at both ends, and toggles mode on the current step', () => {
    render(<Presentation steps={steps} title="Deck" />)
    press('ArrowLeft')
    expect(index()).toBe(0)
    press('ArrowRight')
    press(' ')
    expect(index()).toBe(2)
    press('PageDown')
    expect(index()).toBe(2)
    press('PageUp')
    expect(index()).toBe(1)
    press('p')
    expect(root().getAttribute('data-mode')).toBe('present')
    expect(index()).toBe(1)
    press('P')
    expect(root().getAttribute('data-mode')).toBe('browse')
    expect(index()).toBe(1)
  })

  it('does not advance when a focused control owns the key', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const button = screen.getByRole('button', { name: 'Step 2: Title 2' })
    button.focus()
    fireEvent.keyDown(button, { key: ' ', bubbles: true })
    fireEvent.keyDown(button, { key: 'ArrowRight', bubbles: true })
    expect(index()).toBe(0)
  })

  it('swipes left to advance and right to go back', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const swipe = (dx: number) => {
      fireEvent.touchStart(root(), { touches: [{ clientX: 300, clientY: 100 }] })
      fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 300 + dx, clientY: 100 }] })
    }
    swipe(-150)
    expect(index()).toBe(1)
    swipe(150)
    expect(index()).toBe(0)
  })

  it('jumps via progress dots and via ToC entries (first step of the era), exposing current state', () => {
    render(<Presentation steps={steps} title="Deck" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 3: Title 3' }))
    expect(index()).toBe(2)
    const dots = [...document.querySelectorAll('[data-presentation-dot]')]
    expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual([null, null, 'step'])
    expect(dots.map((d) => d.getAttribute('data-active'))).toEqual(['false', 'false', 'true'])
    const toc = within(document.querySelector('[data-presentation-toc]') as HTMLElement)
    fireEvent.click(toc.getByRole('button', { name: 'ask' }))
    expect(index()).toBe(0)
    expect(toc.getByRole('button', { name: 'ask' }).getAttribute('aria-current')).toBe('step')
    expect(toc.getByRole('button', { name: 'build' }).getAttribute('data-active')).toBe('false')
  })

  it('previous/next controls move and disable at the ends', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const prev = document.querySelector('[data-presentation-prev]') as HTMLButtonElement
    const next = document.querySelector('[data-presentation-next]') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(next)
    fireEvent.click(next)
    expect(index()).toBe(2)
    expect(next.disabled).toBe(true)
    fireEvent.click(prev)
    expect(index()).toBe(1)
  })

  it('keeps one mounted scene instance across steps that share a group', () => {
    render(<Presentation steps={steps} title="Deck" />)
    expect(mounts).toBe(1)
    press('ArrowRight')
    expect(screen.getByText('beat 2')).toBeTruthy()
    expect(mounts).toBe(1)
    expect(document.querySelectorAll('[data-entity="persisting"]')).toHaveLength(1)
  })

  it('shows the default bottom-right attribution with a hook, and no default brand', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const link = document.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.href).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.closest('[data-presentation-footer]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    expect(document.querySelector('[data-presentation-header] a')).toBeNull()
  })

  it('renders a host-provided brand and allows overriding the attribution', () => {
    render(<Presentation steps={steps} title="Deck" brand={<span>Acme</span>} attribution={false} />)
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('Acme')
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('uses the default 880 x 380 canvas unless overridden', () => {
    const { unmount } = render(<Presentation steps={steps} title="Deck" />)
    const canvas = () => document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect([canvas().style.width, canvas().style.height]).toEqual(['880px', '380px'])
    unmount()
    render(<Presentation steps={steps} title="Deck" design={{ width: 400, height: 200 }} />)
    expect([canvas().style.width, canvas().style.height]).toEqual(['400px', '200px'])
  })

  it('supports raw motion elements with stable layoutIds and layers that are out of normal flow', () => {
    const Raw = () => (
      <SceneLayer data-layer="a">
        <motion.div key="raw" layoutId="raw-entity" data-raw="" style={{ position: 'absolute', left: 12, top: 34 }}>raw</motion.div>
      </SceneLayer>
    )
    const raw = [defineStep({ id: 'r', era: 'e', title: 'R', caption: 'c', Scene: Raw, payload: undefined })]
    render(<Presentation steps={raw} title="Raw" />)
    expect(screen.getByText('raw').getAttribute('data-raw')).toBe('')
    const layer = document.querySelector('[data-layer="a"]') as HTMLElement
    expect([layer.style.position, layer.style.inset]).toEqual(['absolute', '0px'])
  })
})
