import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit'

afterEach(cleanup)

interface Payload {
  beat: number
}

const mounts = { count: 0 }
function Grouped({ payload }: SceneProps<Payload>) {
  const once = useRef(false)
  useEffect(() => {
    if (!once.current) mounts.count += 1
    once.current = true
  }, [])
  return <div data-testid="scene">beat {payload.beat}</div>
}
function Solo() {
  return <div data-testid="solo">solo</div>
}

// Typed grouped payloads cross the <Presentation> boundary without casts.
const STEPS: Step<Payload>[] = [
  { id: 'one', era: 'first', title: 'One', caption: 'Caption one', groupKey: 'g', Scene: Grouped, payload: { beat: 1 } },
  { id: 'two', era: 'first', title: 'Two', caption: 'Caption two', groupKey: 'g', Scene: Grouped, payload: { beat: 2 } },
  { id: 'three', era: 'second', title: 'Three', caption: 'Caption three', groupKey: 'g', Scene: Grouped, payload: { beat: 3 } },
]
const MIXED = [...STEPS, { id: 'solo', era: 'third', title: 'Solo', caption: 'Alone', Scene: Solo, payload: undefined }]

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const index = () => root().getAttribute('data-step-index')
const press = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }))

describe('Presentation chrome', () => {
  it('exposes step count and index hooks', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    expect(root().getAttribute('data-step-count')).toBe('3')
    expect(index()).toBe('0')
    press('ArrowRight')
    expect(index()).toBe('1')
  })

  it('browse mode shows title, caption, ToC, progress and prev/next', () => {
    const { container } = render(<Presentation steps={STEPS} title="Deck" />)
    expect(container.querySelector('[data-presentation-step-title]')?.textContent).toBe('One')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption one')
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-dot]')).toHaveLength(3)
    expect(container.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-next]')).not.toBeNull()
  })

  it('present mode keeps marker and title only, and toggling preserves the step', () => {
    const { container } = render(<Presentation steps={STEPS} title="Deck" initialMode="present" />)
    expect(container.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-step-title]')?.textContent).toBe('One')
    for (const sel of ['caption', 'toc', 'prev', 'next', 'dot']) {
      expect(container.querySelector(`[data-presentation-${sel}]`)).toBeNull()
    }
    press('ArrowRight')
    press('p')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(index()).toBe('1')
    fireEvent.click(container.querySelector('[data-presentation-mode-toggle]')!)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(index()).toBe('1')
  })

  it('numbers steps by position in the marker', () => {
    const { container } = render(<Presentation steps={STEPS} title="Deck" />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toContain('1 / 3')
    press('ArrowRight')
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toContain('2 / 3')
  })

  it('jumps from progress dots and ToC entries, exposing current state', () => {
    const { container } = render(<Presentation steps={STEPS} title="Deck" />)
    const dots = container.querySelectorAll<HTMLElement>('[data-presentation-dot]')
    fireEvent.click(dots[2])
    expect(index()).toBe('2')
    expect(dots[2].getAttribute('aria-current')).toBe('step')
    expect(dots[2].getAttribute('data-presentation-active')).toBe('true')
    expect(dots[0].getAttribute('aria-current')).toBeNull()
    expect(dots[0].getAttribute('data-presentation-active')).toBe('false')
    const entries = container.querySelectorAll<HTMLElement>('[data-presentation-toc-entry]')
    expect(entries).toHaveLength(2)
    fireEvent.click(entries[0])
    expect(index()).toBe('0')
    expect(entries[0].getAttribute('aria-current')).toBe('true')
    press('ArrowRight')
    expect(entries[0].getAttribute('aria-current')).toBe('true')
    expect(entries[1].getAttribute('aria-current')).toBeNull()
  })

  it('on-screen controls navigate and disable at the ends', () => {
    const { container } = render(<Presentation steps={STEPS} title="Deck" />)
    const prev = container.querySelector<HTMLButtonElement>('[data-presentation-prev]')!
    const next = container.querySelector<HTMLButtonElement>('[data-presentation-next]')!
    expect(prev.disabled).toBe(true)
    fireEvent.click(next)
    fireEvent.click(next)
    expect(index()).toBe('2')
    expect(next.disabled).toBe(true)
    fireEvent.click(prev)
    expect(index()).toBe('1')
  })

  it('does not advance the deck when a focused control receives keys', () => {
    const { container } = render(<Presentation steps={STEPS} title="Deck" />)
    const dot = container.querySelector<HTMLElement>('[data-presentation-dot]')!
    act(() => void fireEvent.keyDown(dot, { key: 'ArrowRight' }))
    expect(index()).toBe('0')
  })

  it('shows the default attribution and no default brand', () => {
    const { container } = render(<Presentation steps={STEPS} title="Deck" />)
    const a = container.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(a.textContent).toBe('made by and-scene')
    expect(a.href).toBe('https://github.com/Codagent-AI/and-scene')
    expect(container.querySelector('[data-presentation-brand-slot]')?.textContent).toBe('')
    expect(container.querySelectorAll('a')).toHaveLength(1)
  })

  it('lets hosts provide a brand and override or remove attribution', () => {
    const { container, rerender } = render(
      <Presentation steps={STEPS} title="Deck" brand={<span>host</span>} attribution={{ label: 'custom', href: 'https://example.com/' }} />,
    )
    expect(within(container.querySelector<HTMLElement>('[data-presentation-brand-slot]')!).getByText('host')).toBeTruthy()
    expect(container.querySelector('[data-presentation-attribution]')?.textContent).toBe('custom')
    rerender(<Presentation steps={STEPS} title="Deck" attribution={false} />)
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})

describe('Presentation guards', () => {
  it('fails with a clear message when given no steps', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('Presentation requires at least one step')
    quiet.mockRestore()
  })
})

describe('Stage and scene groups', () => {
  it('keeps one Scene instance across grouped steps and updates the payload', () => {
    mounts.count = 0
    render(<Presentation steps={STEPS} title="Deck" />)
    expect(screen.getByTestId('scene').textContent).toBe('beat 1')
    press('ArrowRight')
    press('ArrowRight')
    expect(screen.getByTestId('scene').textContent).toBe('beat 3')
    expect(mounts.count).toBe(1)
  })

  it('swaps scenes when the group changes', async () => {
    render(<Presentation steps={MIXED} title="Deck" />)
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(screen.getByTestId('solo')).toBeTruthy()
  })

  it('renders the canvas at the default 880 × 380 design size', () => {
    const { container } = render(<Presentation steps={STEPS} title="Deck" />)
    const canvas = container.querySelector<HTMLElement>('[data-presentation-canvas]')!
    expect([canvas.style.width, canvas.style.height]).toEqual(['880px', '380px'])
    expect(Number(canvas.getAttribute('data-presentation-scale'))).toBeGreaterThan(0)
  })

  it('honors a canvas override', () => {
    const { container } = render(<Presentation steps={STEPS} title="Deck" canvas={{ width: 400, height: 200 }} />)
    expect(container.querySelector<HTMLElement>('[data-presentation-canvas]')!.style.width).toBe('400px')
  })
})
