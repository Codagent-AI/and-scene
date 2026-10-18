import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode, useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../presentation-kit'
import type { SceneProps, Step } from '../presentation-kit'
import { makeSteps, setViewportWidth } from './helpers'

const root = () => document.querySelector('[data-presentation-root]')!
const index = () => Number(root().getAttribute('data-step-index'))
const press = (key: string) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })

describe('step numbering', () => {
  it('derives markers from position as steps are inserted, removed, and reordered', () => {
    const steps = makeSteps(3)
    const { rerender } = render(<Presentation steps={steps} title="T" />)
    expect(screen.getByText('1 / 3')).toBeTruthy()
    press('ArrowRight')
    expect(screen.getByText('2 / 3')).toBeTruthy()
    expect(root().getAttribute('data-step-count')).toBe('3')

    const inserted = [steps[0], { ...steps[0], id: 'new', title: 'New' }, ...steps.slice(1)]
    rerender(<Presentation steps={inserted} title="T" />)
    expect(screen.getByText('2 / 4')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'New' })).toBeTruthy()
    press('ArrowRight')
    expect(screen.getByText('3 / 4')).toBeTruthy()

    rerender(<Presentation steps={[inserted[3], inserted[0]]} title="T" />)
    press('ArrowLeft')
    expect(screen.getByText(/ \/ 2$/)).toBeTruthy()
    expect(root().getAttribute('data-step-count')).toBe('2')
  })

  it('renders the active step narration, not stale data', () => {
    render(<Presentation steps={makeSteps(3)} title="T" />)
    expect(screen.getByText('Caption 1')).toBeTruthy()
    press('ArrowRight')
    expect(screen.getByRole('heading', { name: 'Title 2' })).toBeTruthy()
    expect(screen.getByText('Caption 2')).toBeTruthy()
    expect(screen.queryByText('Caption 1')).toBeNull()
  })

  it('rejects duplicate step ids', () => {
    const steps = makeSteps(2)
    steps[1] = { ...steps[1], id: steps[0].id }
    const quiet = () => {}
    const original = console.error
    console.error = quiet
    try {
      expect(() => render(<Presentation steps={steps} title="T" />)).toThrow(/Duplicate step id/)
    } finally {
      console.error = original
    }
  })
})

describe('step hooks', () => {
  it('exposes zero-based data-step-index and data-step-count on the chrome root', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    expect(root().getAttribute('data-step-count')).toBe('4')
    expect(index()).toBe(0)
    press('ArrowRight')
    expect(index()).toBe(1)
    expect(root().getAttribute('aria-label')).toBe('Deck')
  })
})

describe('modes', () => {
  it('present mode shows marker and one-line title only', () => {
    setViewportWidth(1400)
    render(<Presentation steps={makeSteps(4)} title="T" initialMode="present" />)
    expect(screen.getByText('1 / 4')).toBeTruthy()
    expect(screen.getAllByRole('heading', { name: 'Title 1' })).toHaveLength(1)
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-controls]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
  })

  it('browse mode shows title, caption, ToC on wide viewports, controls, and progress', () => {
    setViewportWidth(1400)
    render(<Presentation steps={makeSteps(4, ['a', 'a', 'b', 'b'])} title="T" initialMode="browse" />)
    expect(screen.getAllByRole('heading', { name: 'Title 1' })).toHaveLength(1)
    expect(screen.getByText('Caption 1')).toBeTruthy()
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-dot]')).toHaveLength(4)
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
  })

  it('omits the ToC below 1024px and tracks resizes across that boundary', () => {
    setViewportWidth(1023)
    render(<Presentation steps={makeSteps(3)} title="T" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    act(() => setViewportWidth(1024))
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    act(() => setViewportWidth(900))
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })

  it('P toggles chrome both ways while preserving the step', () => {
    setViewportWidth(1400)
    render(<Presentation steps={makeSteps(5)} title="T" initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(index()).toBe(2)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    press('p')
    expect(index()).toBe(2)
    expect(document.querySelector('[data-presentation-caption]')).not.toBeNull()
  })
})

describe('on-screen navigation', () => {
  it('previous and next buttons change the active step and are disabled at the ends', () => {
    render(<Presentation steps={makeSteps(3)} title="T" initialMode="browse" />)
    const prev = document.querySelector<HTMLButtonElement>('[data-presentation-prev]')!
    const next = document.querySelector<HTMLButtonElement>('[data-presentation-next]')!
    expect(prev.disabled).toBe(true)
    fireEvent.click(next)
    expect(screen.getByRole('heading', { name: 'Title 2' })).toBeTruthy()
    fireEvent.click(next)
    expect(screen.getByText('Caption 3')).toBeTruthy()
    expect(next.disabled).toBe(true)
    fireEvent.click(prev)
    expect(index()).toBe(1)
  })

  it('progress dots jump to their exact step', () => {
    render(<Presentation steps={makeSteps(5)} title="T" />)
    const dots = document.querySelectorAll<HTMLButtonElement>('[data-presentation-progress-dot]')
    ;[3, 0, 4, 2].forEach((target) => {
      fireEvent.click(dots[target])
      expect(index()).toBe(target)
      expect(screen.getByText(`Caption ${target + 1}`)).toBeTruthy()
      expect(screen.getByText(`scene ${target + 1} of s${target + 1}`)).toBeTruthy()
    })
  })

  it('ToC entries jump to the first step of their era, not the current or last', () => {
    setViewportWidth(1400)
    render(<Presentation steps={makeSteps(6, ['a', 'a', 'b', 'b', 'b', 'c'])} title="T" />)
    const entries = () => within(document.querySelector<HTMLElement>('[data-presentation-toc]')!).getAllByRole('button')
    expect(entries().map((e) => e.textContent)).toEqual(['a', 'b', 'c'])
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(index()).toBe(4)
    fireEvent.click(entries()[1])
    expect(index()).toBe(2)
    fireEvent.click(entries()[0])
    expect(index()).toBe(0)
    fireEvent.click(entries()[2])
    expect(index()).toBe(5)
  })

  it('only the active progress dot and ToC entry carry aria-current and the active hook', () => {
    setViewportWidth(1400)
    render(<Presentation steps={makeSteps(4, ['a', 'a', 'b', 'c'])} title="T" />)
    const check = (activeDot: number, activeEra: number) => {
      const dots = [...document.querySelectorAll('[data-presentation-progress-dot]')]
      dots.forEach((dot, i) => {
        expect(dot.getAttribute('aria-current') === 'step').toBe(i === activeDot)
        expect(dot.hasAttribute('data-presentation-active')).toBe(i === activeDot)
      })
      const entries = [...document.querySelectorAll('[data-presentation-toc-entry]')]
      entries.forEach((entry, i) => {
        expect(entry.getAttribute('aria-current') === 'step').toBe(i === activeEra)
        expect(entry.hasAttribute('data-presentation-active')).toBe(i === activeEra)
      })
    }
    check(0, 0)
    press('ArrowRight')
    check(1, 0)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-dot]')[3])
    check(3, 2)
    press('p')
    press('p')
    check(3, 2)
  })
})

describe('chrome ownership', () => {
  it('renders the default attribution in both modes, linked and hooked', () => {
    render(<Presentation steps={makeSteps(2)} title="T" initialMode="present" />)
    const check = () => {
      const links = document.querySelectorAll<HTMLAnchorElement>('[data-presentation-attribution]')
      expect(links).toHaveLength(1)
      expect(links[0].textContent).toBe('made by and-scene')
      expect(links[0].getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
      expect(links[0].getAttribute('target')).toBe('_blank')
      expect(links[0].getAttribute('rel')).toContain('noopener')
      expect(links[0].getAttribute('rel')).toContain('noreferrer')
      expect(links[0].style.position).toBe('absolute')
      expect(links[0].style.right).toBe('0px')
      expect(links[0].style.bottom).toBe('0px')
      expect(links[0].parentElement).toBe(root())
      expect((root() as HTMLElement).style.position).toBe('relative')
    }
    check()
    press('p')
    check()
  })

  it('allows attribution overrides and opting out', () => {
    const { rerender } = render(<Presentation steps={makeSteps(2)} title="T" attribution={{ label: 'custom', href: 'https://example.test' }} />)
    expect(screen.getByText('custom').getAttribute('href')).toBe('https://example.test')
    rerender(<Presentation steps={makeSteps(2)} title="T" attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('has no top-left brand by default but renders a host-provided one', () => {
    const { unmount } = render(<Presentation steps={makeSteps(2)} title="T" />)
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    expect(document.querySelector('[data-presentation-header] a')).toBeNull()
    unmount()
    render(<Presentation steps={makeSteps(2)} title="T" brand={<a href="https://host.test">Host</a>} />)
    expect(within(document.querySelector<HTMLElement>('[data-presentation-brand]')!).getByText('Host').getAttribute('href')).toBe('https://host.test')
  })

  it('sets the document title from the presentation title', () => {
    render(<Presentation steps={makeSteps(2)} title="My talk" />)
    expect(document.title).toBe('My talk')
  })
})

describe('StrictMode', () => {
  it('handles one navigation event as one step', () => {
    render(
      <StrictMode>
        <Presentation steps={makeSteps(4)} title="T" />
      </StrictMode>,
    )
    press('ArrowRight')
    expect(index()).toBe(1)
    press('p')
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
  })
})

describe('reuse', () => {
  interface Free { label: string }
  function FreeScene({ payload }: SceneProps<Free>) {
    useEffect(() => {}, [])
    return <p>{payload.label}</p>
  }
  it('renders an independently authored grouped deck with different content', () => {
    const steps: Step<Free>[] = ['alpha', 'beta'].map((label, i) => ({
      id: label,
      era: 'x',
      title: `T-${label}`,
      caption: `C-${label}`,
      groupKey: 'g',
      Scene: FreeScene,
      payload: { label: `payload ${i}` },
    }))
    render(<Presentation steps={steps} title="Free" />)
    expect(screen.getByText('payload 0')).toBeTruthy()
    press('ArrowRight')
    expect(screen.getByText('payload 1')).toBeTruthy()
    expect(screen.getByText('C-beta')).toBeTruthy()
  })
})
