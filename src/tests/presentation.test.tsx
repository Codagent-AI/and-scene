import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Presentation } from '../presentation-kit'
import { typedSteps } from './steps'
import { OtherScene } from './fixtures'
import { counter } from './counter'
import Landing from '../Landing'

const idx = (c: HTMLElement) => c.querySelector('[data-presentation-root]')!.getAttribute('data-step-index')
const key = (k: string, target: Element | Window = window) => act(() => void fireEvent.keyDown(target, { key: k }))

beforeEach(() => {
  counter.mounts = 0
  Object.defineProperty(window, 'innerWidth', { value: 1400, configurable: true })
})
afterEach(cleanup)

describe('<Presentation>', () => {
  it('exposes count/index and navigates with clamping', () => {
    const { container } = render(<Presentation steps={typedSteps} title="Talk" />)
    const root = container.querySelector('[data-presentation-root]')!
    expect(root.getAttribute('data-step-count')).toBe('3')
    key('ArrowLeft')
    expect(idx(container)).toBe('0')
    key('ArrowRight')
    key(' ')
    key('PageDown')
    expect(idx(container)).toBe('2')
    key('PageUp')
    expect(idx(container)).toBe('1')
  })

  it('swipes', () => {
    const { container } = render(<Presentation steps={typedSteps} title="Talk" />)
    act(() => {
      fireEvent.touchStart(window, { touches: [{ identifier: 1, clientX: 200, clientY: 0 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ identifier: 1, clientX: 100, clientY: 0 }] })
    })
    expect(idx(container)).toBe('1')
    act(() => {
      fireEvent.touchStart(window, { touches: [{ identifier: 1, clientX: 100, clientY: 0 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ identifier: 1, clientX: 200, clientY: 0 }] })
    })
    expect(idx(container)).toBe('0')
  })

  it('does not hijack focused controls', () => {
    const { container } = render(<Presentation steps={typedSteps} title="Talk" />)
    const btn = container.querySelector('[data-presentation-next]')!
    key('ArrowRight', btn)
    expect(idx(container)).toBe('0')
  })

  it('toggles mode preserving position; present hides caption/toc/nav', () => {
    const { container } = render(<Presentation steps={typedSteps} title="Talk" />)
    key('ArrowRight')
    expect(container.querySelector('[data-presentation-caption]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-progress]')).not.toBeNull()
    key('p')
    expect(idx(container)).toBe('1')
    const root = container.querySelector('[data-presentation-root]')!
    expect(root.getAttribute('data-presentation-mode')).toBe('present')
    for (const s of ['caption', 'toc', 'progress', 'prev', 'next']) {
      expect(container.querySelector(`[data-presentation-${s}]`)).toBeNull()
    }
    expect(container.querySelector('[data-presentation-marker]')).not.toBeNull()
  })

  it('honors initialMode', () => {
    const { container } = render(<Presentation steps={typedSteps} title="Talk" initialMode="present" />)
    expect(container.querySelector('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('present')
  })

  it('exposes active state on progress and ToC, and jumps', () => {
    const { container } = render(<Presentation steps={typedSteps} title="Talk" />)
    const dots = container.querySelectorAll('[data-presentation-progress-dot]')
    expect(dots[0].getAttribute('aria-current')).toBe('step')
    expect(dots[0].getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(dots[1])
    expect(idx(container)).toBe('1')
    expect(container.querySelectorAll('[data-presentation-progress-dot][aria-current]').length).toBe(1)
    const toc = container.querySelectorAll('[data-presentation-toc-entry]')
    expect(toc).toHaveLength(2)
    fireEvent.click(toc[1])
    expect(idx(container)).toBe('2')
    expect(toc[1].getAttribute('aria-current')).toBe('location')
    expect(toc[0].getAttribute('aria-current')).toBeNull()
  })

  it('hides the ToC on narrow viewports', () => {
    Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true })
    const { container } = render(<Presentation steps={typedSteps} title="Talk" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
  })

  it('keeps one Scene instance across grouped steps', () => {
    const { container } = render(<Presentation steps={typedSteps} title="Talk" />)
    expect(screen.getByTestId('scene').textContent).toBe('a')
    key('ArrowRight')
    expect(screen.getByTestId('scene').textContent).toBe('b')
    expect(counter.mounts).toBe(1)
    expect(idx(container)).toBe('1')
  })

  it('renders default attribution, no default brand, and no inline visual styles', () => {
    const { container } = render(<Presentation steps={typedSteps} title="Talk" />)
    const a = container.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('made by and-scene')
    expect(a.href).toBe('https://github.com/Codagent-AI/and-scene')
    expect(container.querySelector('[data-presentation-brand]')!.childNodes).toHaveLength(0)
    for (const el of container.querySelectorAll<HTMLElement>('[style]')) {
      const s = el.getAttribute('style')!
      expect(s).not.toMatch(/color|font|border|shadow|background/)
    }
  })

  it('allows overriding attribution and brand', () => {
    const { container } = render(
      <Presentation steps={typedSteps} title="Talk" attribution={false} brand={<a href="/">home</a>} />,
    )
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
    expect(container.querySelector('[data-presentation-brand]')!.textContent).toBe('home')
  })
})

describe('step validation', () => {
  it('rejects duplicate ids', () => {
    const dup = [typedSteps[0], typedSteps[0]]
    expect(() => render(<Presentation steps={dup} title="x" />)).toThrow(/duplicate step id/)
  })
  it('ignores multi-touch sequences', () => {
    const { container } = render(<Presentation steps={typedSteps} title="Talk" />)
    act(() => {
      fireEvent.touchStart(window, { touches: [{ identifier: 1, clientX: 200, clientY: 0 }, { identifier: 2, clientX: 300, clientY: 0 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ identifier: 2, clientX: 50, clientY: 0 }] })
    })
    expect(idx(container)).toBe('0')
  })
  it('rejects mismatched Scene/payload pairs at compile time', () => {
    const bad = { id: 'z', era: 'E', title: 'Z', caption: 'c', Scene: OtherScene, payload: { label: 'x' } }
    // @ts-expect-error payload does not match OtherScene's props
    const el = <Presentation steps={[bad]} title="x" />
    expect(el).toBeTruthy()
  })
})

describe('<Landing>', () => {
  it('lists registry entries', () => {
    render(<Landing registry={[{ slug: 'x', title: 'X talk', load: async () => ({ default: () => null }) }]} />)
    expect(screen.getByText('X talk').getAttribute('href')).toBe('/x')
  })
})
