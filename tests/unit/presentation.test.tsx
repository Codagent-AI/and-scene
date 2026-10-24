import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { mounts } from './counter'
import { makeSteps } from './steps'

const root = (c: HTMLElement) => c.querySelector('[data-presentation-root]') as HTMLElement
const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }))

beforeEach(() => {
  mounts.count = 0
})

describe('modes', () => {
  it('present mode shows marker and one-line title only', () => {
    const { container } = render(<Presentation steps={makeSteps(4)} title="Deck" initialMode="present" />)
    const r = root(container)
    expect(r).toHaveAttribute('data-presentation-mode', 'present')
    expect(r.querySelector('[data-presentation-marker]')).toHaveTextContent('01 / 04')
    expect(r.querySelector('[data-presentation-step-title]')).toHaveTextContent('Title 1')
    for (const hook of [
      'step-caption',
      'toc',
      'prev',
      'next',
      'progress',
    ]) {
      expect(r.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    }
  })

  it('browse mode shows title, caption, ToC on wide viewports, controls and progress', () => {
    const { container } = render(<Presentation steps={makeSteps(4)} title="Deck" />)
    const r = root(container)
    expect(r).toHaveAttribute('data-presentation-mode', 'browse')
    expect(r.querySelector('[data-presentation-step-title]')).toHaveTextContent('Title 1')
    expect(r.querySelector('[data-presentation-step-caption]')).toHaveTextContent('Caption 1')
    expect(r.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(r.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(r.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(r.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(4)
  })

  it('hides the ToC on narrow viewports', () => {
    const original = window.innerWidth
    window.innerWidth = 600
    try {
      const { container } = render(<Presentation steps={makeSteps(4)} title="Deck" />)
      expect(root(container).querySelector('[data-presentation-toc]')).toBeNull()
    } finally {
      window.innerWidth = original
    }
  })

  it('P toggles the mode while staying on the current step', () => {
    const { container } = render(<Presentation steps={makeSteps(4)} title="Deck" />)
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    const r = root(container)
    expect(r).toHaveAttribute('data-presentation-mode', 'present')
    expect(r).toHaveAttribute('data-step-index', '2')
    key('p')
    expect(r).toHaveAttribute('data-presentation-mode', 'browse')
    expect(r).toHaveAttribute('data-step-index', '2')
  })
})

describe('step hooks and numbering', () => {
  it('exposes step count, index and narration hooks', () => {
    const { container } = render(<Presentation steps={makeSteps(3)} title="Deck" />)
    const r = root(container)
    expect(r).toHaveAttribute('data-step-count', '3')
    expect(r).toHaveAttribute('data-step-index', '0')
    expect(r).toHaveAttribute('data-presentation-title', 'Title 1')
    expect(r).toHaveAttribute('data-presentation-caption', 'Caption 1')
    key('ArrowRight')
    expect(r).toHaveAttribute('data-step-index', '1')
    expect(r).toHaveAttribute('data-presentation-title', 'Title 2')
  })

  it('derives numbers from position when steps are reordered', () => {
    const steps = makeSteps(3)
    const { container, rerender } = render(<Presentation steps={steps} title="Deck" />)
    key('ArrowRight')
    expect(container.querySelector('[data-presentation-marker-number]')).toHaveTextContent('02 / 03')
    expect(container.querySelector('[data-presentation-step-title]')).toHaveTextContent('Title 2')
    rerender(<Presentation steps={[steps[1], steps[0], steps[2]]} title="Deck" />)
    expect(container.querySelector('[data-presentation-marker-number]')).toHaveTextContent('02 / 03')
    expect(container.querySelector('[data-presentation-step-title]')).toHaveTextContent('Title 1')
    rerender(<Presentation steps={[steps[0], steps[2]]} title="Deck" />)
    expect(container.querySelector('[data-presentation-marker-number]')).toHaveTextContent('02 / 02')
  })

  it('shows a caption for each step', () => {
    const { container } = render(<Presentation steps={makeSteps(3)} title="Deck" />)
    for (let i = 1; i <= 3; i++) {
      expect(container.querySelector('[data-presentation-step-caption]')).toHaveTextContent(`Caption ${i}`)
      key('ArrowRight')
    }
  })
})

describe('direct jumps and active state', () => {
  it('jumps via a progress indicator', () => {
    const { container } = render(<Presentation steps={makeSteps(4)} title="Deck" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 3: Title 3' }))
    expect(root(container)).toHaveAttribute('data-step-index', '2')
  })

  it('jumps to the first step of an era via a ToC entry', () => {
    const { container } = render(<Presentation steps={makeSteps(4)} title="Deck" />)
    fireEvent.click(within(container.querySelector('[data-presentation-toc]') as HTMLElement).getByText('second'))
    expect(root(container)).toHaveAttribute('data-step-index', '2')
    fireEvent.click(within(container.querySelector('[data-presentation-toc]') as HTMLElement).getByText('first'))
    expect(root(container)).toHaveAttribute('data-step-index', '0')
  })

  it('prev/next buttons navigate and clamp', () => {
    const { container } = render(<Presentation steps={makeSteps(2)} title="Deck" />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(root(container)).toHaveAttribute('data-step-index', '0')
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(root(container)).toHaveAttribute('data-step-index', '1')
  })

  it('marks only the active progress item and ToC entry as current', () => {
    const { container } = render(<Presentation steps={makeSteps(4)} title="Deck" />)
    key('ArrowRight')
    key('ArrowRight')
    const dots = [...container.querySelectorAll('[data-presentation-progress-item]')]
    expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual([null, null, 'step', null])
    expect(dots.map((d) => d.getAttribute('data-presentation-active'))).toEqual(['false', 'false', 'true', 'false'])
    const toc = [...container.querySelectorAll('[data-presentation-toc-item]')]
    expect(toc.map((t) => t.getAttribute('aria-current'))).toEqual([null, 'step'])
    expect(toc.map((t) => t.getAttribute('data-presentation-active'))).toEqual(['false', 'true'])
  })

  it('focused controls keep their keys instead of advancing the deck', () => {
    const { container } = render(<Presentation steps={makeSteps(4)} title="Deck" />)
    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus()
    act(() => void fireEvent.keyDown(next, { key: 'ArrowRight' }))
    act(() => void fireEvent.keyDown(next, { key: ' ' }))
    expect(root(container)).toHaveAttribute('data-step-index', '0')
  })
})

describe('attribution and branding', () => {
  it('shows the default bottom-right attribution with a styling hook', () => {
    const { container } = render(<Presentation steps={makeSteps(2)} title="Deck" />)
    const link = container.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link).toHaveTextContent('made by and-scene')
    expect(link.href).toContain('github.com/')
    expect(link.closest('footer')).not.toBeNull()
    expect(link.style.marginLeft).toBe('auto')
  })

  it('shows attribution in present mode too and can be removed', () => {
    const { container, rerender } = render(<Presentation steps={makeSteps(2)} title="Deck" initialMode="present" />)
    expect(container.querySelector('[data-presentation-attribution]')).not.toBeNull()
    rerender(<Presentation steps={makeSteps(2)} title="Deck" initialMode="present" attribution={false} />)
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('renders no and-scene brand in the header unless the host provides one', () => {
    const { container, rerender } = render(<Presentation steps={makeSteps(2)} title="Deck" />)
    const header = container.querySelector('[data-presentation-header]') as HTMLElement
    expect(header.querySelector('a')).toBeNull()
    expect(header.textContent).not.toMatch(/and-scene/i)
    rerender(<Presentation steps={makeSteps(2)} title="Deck" brand={<a href="/">host</a>} />)
    expect(container.querySelector('[data-presentation-brand] a')).toHaveTextContent('host')
  })
})

describe('grouped scenes', () => {
  it('keeps one scene instance across navigation within a group', async () => {
    const { container } = render(<Presentation steps={makeSteps(4)} title="Deck" />)
    expect(screen.getByTestId('scene')).toHaveTextContent('scene 1')
    key('ArrowRight')
    key('ArrowRight')
    await waitFor(() => expect(screen.getByTestId('scene')).toHaveTextContent('scene 3'))
    expect(container.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
    expect(mounts.count).toBe(1)
  })

  it('remounts the scene when steps are not grouped', async () => {
    render(<Presentation steps={makeSteps(3, false)} title="Deck" />)
    key('ArrowRight')
    key('ArrowRight')
    await waitFor(() => expect(screen.getByTestId('scene')).toHaveTextContent('scene 3'))
    expect(mounts.count).toBe(3)
  })

  it('accepts a typed payload step array with no casts at the boundary', () => {
    // The generic payload type flows through <Presentation>; this file is type-checked by `tsc -b`.
    const steps = makeSteps(1)
    const element = <Presentation steps={steps} title="Typed" />
    expect(element.props.steps[0].payload.n).toBe(1)
  })
})

describe('typed step payloads', () => {
  it('rejects steps whose scene payload type does not match', () => {
    const steps = makeSteps(1)
    // @ts-expect-error payload must match the scene's payload type
    const bad = <Presentation steps={[{ ...steps[0], payload: { n: 'one' } }]} title="Bad" />
    expect(bad).toBeTruthy()
  })
})
