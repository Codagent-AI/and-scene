// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation, TOC_MIN_VIEWPORT } from '../../src/presentation-kit/index.ts'
import { FIVE, makeSteps, mockViewport } from '../support/fixtures.tsx'

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const index = () => root().getAttribute('data-step-index')
const q = (selector: string) => document.querySelector(selector)
const qa = (selector: string) => Array.from(document.querySelectorAll(selector))

beforeEach(() => mockViewport(1280, 800))

describe('step numbering (M-02)', () => {
  it('derives marker and data-step-index from position after insert, remove and reorder', () => {
    const [a, b, c] = FIVE
    const marker = () => q('[data-presentation-marker]')!.textContent
    const view = render(<Presentation steps={[a, b, c]} />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect([marker(), index(), q('[data-step-id]')!.getAttribute('data-step-id')]).toEqual(['2', '1', 'b'])

    view.rerender(<Presentation steps={[a, c, b]} />) // reorder: position 1 is now "c"
    expect([marker(), index(), root().getAttribute('data-step-id')]).toEqual(['2', '1', 'c'])

    view.rerender(<Presentation steps={[c, a, b]} />) // insert in front, shifting everything
    expect([marker(), index(), root().getAttribute('data-step-id')]).toEqual(['2', '1', 'a'])

    view.rerender(<Presentation steps={[a, b]} />) // remove: position stays 1, new occupant
    expect([marker(), index(), root().getAttribute('data-step-id')]).toEqual(['2', '1', 'b'])
  })
})

describe('chrome hooks (M-28)', () => {
  it('exposes the exact step count and zero-based index through every kind of navigation', () => {
    render(<Presentation steps={FIVE} />)
    const state = () => [root().getAttribute('data-step-count'), index(), q('[data-presentation-title]')!.textContent]
    expect(state()).toEqual(['5', '0', 'Title a'])
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(state()).toEqual(['5', '1', 'Title b'])
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(state()).toEqual(['5', '0', 'Title a'])
    fireEvent.click(screen.getByRole('button', { name: /Step 4/ }))
    expect(state()).toEqual(['5', '3', 'Title d'])
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    expect(index()).toBe('3')
  })
})

describe('modes (M-17, M-18, M-19)', () => {
  it('present mode shows the marker and one-line title only', () => {
    render(<Presentation steps={FIVE} initialMode="present" />)
    expect(q('[data-presentation-marker]')!.textContent).toBe('1')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title a')
    expect(q('[data-presentation-title]')!.getAttribute('style')).toContain('white-space: nowrap')
    for (const hook of ['caption', 'toc', 'prev', 'next', 'progress']) {
      expect(q(`[data-presentation-${hook}]`), hook).toBeNull()
    }
    expect(screen.queryByText('Caption a')).toBeNull()
  })

  it('browse mode shows title, caption, progress, prev/next and the ToC on wide viewports', () => {
    render(<Presentation steps={FIVE} initialMode="browse" />)
    expect(q('[data-presentation-title]')!.textContent).toBe('Title a')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption a')
    expect(qa('[data-presentation-progress-item]')).toHaveLength(5)
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(qa('[data-presentation-toc-item]').map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
  })

  it('defaults to browse when initialMode is omitted', () => {
    render(<Presentation steps={FIVE} />)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
  })

  it('hides the ToC below the breakpoint but keeps the rest of browse chrome', () => {
    mockViewport(TOC_MIN_VIEWPORT - 1, 700)
    render(<Presentation steps={FIVE} />)
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-caption]')).not.toBeNull()
    expect(q('[data-presentation-progress]')).not.toBeNull()
    act(() => {
      mockViewport(TOC_MIN_VIEWPORT, 700)
      window.dispatchEvent(new Event('resize'))
    })
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })

  it('toggles by button and P key in both directions without moving the step', async () => {
    render(<Presentation steps={FIVE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    const mode = () => root().getAttribute('data-presentation-mode')
    const toggle = () => q('[data-presentation-mode-toggle]') as HTMLElement
    fireEvent.click(toggle())
    expect([mode(), index(), q('[data-presentation-caption]')]).toEqual(['present', '2', null])
    fireEvent.click(toggle())
    expect([mode(), index(), q('[data-presentation-caption]')!.textContent]).toEqual(['browse', '2', 'Caption c'])
    fireEvent.keyDown(document.body, { key: 'p' })
    expect([mode(), index()]).toEqual(['present', '2'])
    fireEvent.keyDown(document.body, { key: 'p' })
    expect([mode(), index()]).toEqual(['browse', '2'])
  })
})

describe('direct jumps and active state (M-22, M-23)', () => {
  it('progress dots jump to their step; ToC entries jump to the first step of the era', async () => {
    render(<Presentation steps={FIVE} />)
    const dots = () => qa('[data-presentation-progress-item]')
    const toc = () => qa('[data-presentation-toc-item]')
    fireEvent.click(dots()[3])
    expect(index()).toBe('3')
    fireEvent.click(toc()[0])
    expect(index()).toBe('0')
    fireEvent.click(toc()[1])
    expect(index()).toBe('2') // first step of "two", not its last
    fireEvent.click(toc()[2])
    expect(index()).toBe('4')
    fireEvent.click(toc()[1])
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption c')
  })

  it('only the current dot and its era carry aria-current and the active hook, at every index', () => {
    render(<Presentation steps={FIVE} />)
    const eraOf = ['one', 'one', 'two', 'two', 'three']
    for (let i = 0; i < 5; i++) {
      fireEvent.click(qa('[data-presentation-progress-item]')[i])
      const dots = qa('[data-presentation-progress-item]')
      dots.forEach((dot, j) => {
        expect(dot.getAttribute('aria-current') === 'step', `dot ${j} at ${i}`).toBe(j === i)
        expect(dot.hasAttribute('data-presentation-active')).toBe(j === i)
      })
      qa('[data-presentation-toc-item]').forEach((entry) => {
        const active = entry.textContent === eraOf[i]
        expect(['true', 'step'].includes(entry.getAttribute('aria-current') ?? ''), `${entry.textContent} at ${i}`).toBe(active)
        expect(entry.hasAttribute('data-presentation-active')).toBe(active)
        if (!active) expect(entry.hasAttribute('aria-current')).toBe(false)
      })
    }
  })
})

describe('boundaries (M-25)', () => {
  it('disables prev at the start and next at the end and stays put on keys', () => {
    render(<Presentation steps={FIVE} />)
    const prev = screen.getByRole('button', { name: 'Previous step' }) as HTMLButtonElement
    const next = screen.getByRole('button', { name: 'Next step' }) as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(prev)
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(index()).toBe('0')
    fireEvent.click(qa('[data-presentation-progress-item]')[4])
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    fireEvent.keyDown(document.body, { key: 'PageDown' })
    expect(index()).toBe('4')
  })

  it('a one-step deck has both controls disabled', () => {
    render(<Presentation steps={makeSteps([{ id: 'only', era: 'x' }])} />)
    expect((screen.getByRole('button', { name: 'Previous step' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Next step' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('focused controls keep their keys inside the composed presentation (M-24)', () => {
  it('Space on a focused dot activates that control and does not also advance', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={FIVE} />)
    const dot = qa('[data-presentation-progress-item]')[3] as HTMLElement
    dot.focus()
    await user.keyboard(' ')
    expect(index()).toBe('3') // one click on the dot, not click + advance (which would be 4)
    await user.keyboard('{ArrowRight}')
    expect(index()).toBe('3')
  })
})

describe('attribution and branding (M-14, M-15, M-16)', () => {
  it('shows the default bottom-right link with a stable hook in both modes', () => {
    render(<Presentation steps={FIVE} />)
    for (const mode of ['browse', 'present']) {
      const link = within(q('[data-presentation-attribution-row]') as HTMLElement).getByRole('link', { name: 'made by and-scene' })
      expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
      expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
      const row = q('[data-presentation-attribution-row]') as HTMLElement
      expect(row.style.justifyContent).toBe('flex-end')
      expect(root().lastElementChild).toBe(row) // last row of the column: bottom-right
      if (mode === 'browse') fireEvent.click(q('[data-presentation-mode-toggle]')!)
    }
  })

  it('has no top-left brand by default, and renders a host brand explicitly', () => {
    const { unmount } = render(<Presentation steps={FIVE} />)
    expect(q('[data-presentation-brand]')).toBeNull()
    expect(q('[data-presentation-header] a')).toBeNull()
    expect(q('[data-presentation-header-start]')!.childElementCount).toBe(0)
    unmount()
    render(<Presentation steps={FIVE} brand={<a href="/home">Acme</a>} />)
    const start = q('[data-presentation-header-start]') as HTMLElement
    expect(within(start).getByRole('link', { name: 'Acme' })).toBeTruthy()
    expect(within(start).queryByText('made by and-scene')).toBeNull()
  })

  it('overrides label and href, and can be disabled', () => {
    const { unmount } = render(<Presentation steps={FIVE} attribution={{ label: 'by me', href: 'https://example.test/' }} />)
    const link = screen.getByRole('link', { name: 'by me' })
    expect(link.getAttribute('href')).toBe('https://example.test/')
    expect(screen.queryByText('made by and-scene')).toBeNull()
    unmount()
    render(<Presentation steps={FIVE} attribution={false} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
  })
})

describe('slot props reach the composed chrome (M-11)', () => {
  it('forwards className, style and data attributes to each chrome part', () => {
    const slot = (name: string) => ({ className: `c-${name}`, style: { outlineWidth: '3px' }, 'data-x': name })
    render(
      <Presentation
        steps={FIVE}
        slots={{
          root: slot('root'), header: slot('header'), footer: slot('footer'), toc: slot('toc'), progress: slot('progress'),
          prev: slot('prev'), next: slot('next'), modeToggle: slot('modeToggle'), stage: slot('stage'), canvas: slot('canvas'),
          attribution: slot('attribution'),
        }}
      />,
    )
    const hooks: Record<string, string> = {
      root: 'root', header: 'header', footer: 'footer', toc: 'toc', progress: 'progress', prev: 'prev', next: 'next',
      modeToggle: 'mode-toggle', stage: 'stage', canvas: 'canvas', attribution: 'attribution',
    }
    for (const [name, hook] of Object.entries(hooks)) {
      const el = q(`[data-presentation-${hook}]`) as HTMLElement
      expect(el, name).not.toBeNull()
      expect(el.classList.contains(`c-${name}`), name).toBe(true)
      expect(el.getAttribute('data-x'), name).toBe(name)
      expect(el.style.outlineWidth, name).toBe('3px')
    }
  })
})

describe('StrictMode (C-03)', () => {
  it('moves one step per key press under StrictMode', () => {
    render(
      <StrictMode>
        <Presentation steps={FIVE} />
      </StrictMode>,
    )
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(index()).toBe('1')
  })
})

describe('captions on every step (M-55)', () => {
  it('shows a caption for each step and prev/next move through them', () => {
    render(<Presentation steps={FIVE} />)
    for (let i = 0; i < 5; i++) {
      expect(q('[data-presentation-caption]')!.textContent).toBe(`Caption ${'abcde'[i]}`)
      expect(screen.getAllByTestId('scene').map((e) => e.textContent)).toContain(`${'abcde'[i]}:${i}`)
      if (i < 4) fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption d')
  })
})
