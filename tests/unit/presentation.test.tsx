import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { groupEras } from '../../src/presentation-kit/chrome/groupEras.ts'
import { ATTRIBUTION_HREF } from '../../src/presentation-kit/constants.ts'
import { Presentation } from '../../src/presentation-kit/index.ts'
import { Demo, demoSteps, OtherScene } from './helpers.tsx'

const q = (selector: string) => document.querySelector(selector)
const qa = (selector: string) => Array.from(document.querySelectorAll(selector))
const setWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  fireEvent(window, new Event('resize'))
}

describe('step model and numbering', () => {
  it('renders the active step marker, era, title and caption from the step data', () => {
    render(<Demo />)
    expect(q('[data-presentation-marker]')?.textContent).toBe('1 / 5')
    expect(q('[data-presentation-era]')?.textContent).toBe('one')
    expect(q('[data-presentation-title]')?.textContent).toBe('Title A')
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption A')
    expect(screen.getByTestId('entity').textContent).toBe('A')
  })

  it('derives markers from array position when steps are inserted, removed or reordered', () => {
    const extra = { ...demoSteps[2], id: 'x', title: 'Title X' }
    let setSteps: (s: typeof demoSteps) => void = () => {}
    function Harness() {
      const [steps, set] = useState(demoSteps)
      setSteps = set
      return <Presentation steps={steps} title="T" />
    }
    render(<Harness />)
    const goLast = () => fireEvent.click(screen.getAllByRole('button', { name: /^Step / }).at(-1)!)
    goLast()
    expect(q('[data-presentation-marker]')?.textContent).toBe('5 / 5')
    // insert at the front: the total grows and the position-derived number follows the array
    act(() => setSteps([extra, ...demoSteps]))
    expect(q('[data-presentation-marker]')?.textContent).toBe('5 / 6')
    // remove two steps: markers follow the new positions with no renumbering
    act(() => setSteps([demoSteps[0], demoSteps[1], demoSteps[4]]))
    expect(q('[data-presentation-marker]')?.textContent).toBe('3 / 3')
    // reorder
    act(() => setSteps([demoSteps[4], demoSteps[0], demoSteps[1]]))
    fireEvent.click(screen.getByLabelText('Step 1: Title E'))
    expect(q('[data-presentation-title]')?.textContent).toBe('Title E')
    expect(q('[data-presentation-marker]')?.textContent).toBe('1 / 3')
    expect(demoSteps.every((s) => !('number' in s))).toBe(true)
  })

  it('exposes step hooks that track navigation and step-array changes', () => {
    render(<Demo />)
    const root = q('[data-presentation-root]')!
    const read = () => [
      root.getAttribute('data-step-count'),
      root.getAttribute('data-step-index'),
      root.getAttribute('data-presentation-step-count'),
      root.getAttribute('data-presentation-step-index'),
    ]
    expect(read()).toEqual(['5', '0', '5', '0'])
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(read()).toEqual(['5', '1', '5', '1'])
  })

  it('goes forward and back through distinct titles, captions and scene states', () => {
    render(<Demo />)
    const seen = []
    for (let i = 0; i < 5; i++) {
      seen.push([q('[data-presentation-title]')?.textContent, q('[data-presentation-caption]')?.textContent])
      if (i < 4) fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(new Set(seen.map((s) => s.join('|'))).size).toBe(5)
    for (let i = 3; i >= 0; i--) {
      fireEvent.click(screen.getByLabelText('Previous step'))
      expect(q('[data-presentation-title]')?.textContent).toBe(seen[i][0])
      expect(q('[data-presentation-caption]')?.textContent).toBe(seen[i][1])
    }
  })

  it('renders nothing for an empty step list', () => {
    const { container } = render(<Presentation steps={[]} title="empty" />)
    expect(container.innerHTML).toBe('')
  })
})

describe('modes', () => {
  it('present mode shows marker and one-line title only', () => {
    render(<Demo initialMode="present" />)
    expect(q('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(q('[data-presentation-marker]')).not.toBeNull()
    const title = q('[data-presentation-title]') as HTMLElement
    expect(title.textContent).toBe('Title A')
    expect(title.style.whiteSpace).toBe('nowrap')
    expect(title.style.textOverflow).toBe('ellipsis')
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-prev]')).toBeNull()
    expect(q('[data-presentation-next]')).toBeNull()
    expect(q('[data-presentation-dot]')).toBeNull()
  })

  it('browse mode shows title, caption, controls and progress, and the ToC only on wide viewports', () => {
    setWidth(1400)
    render(<Demo initialMode="browse" />)
    expect(q('[data-presentation-title]')?.textContent).toBe('Title A')
    expect(q('[data-presentation-caption]')?.tagName).toBe('P')
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(qa('[data-presentation-dot]')).toHaveLength(5)
    expect(q('[data-presentation-toc]')).not.toBeNull()
    setWidth(600)
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(qa('[data-presentation-dot]')).toHaveLength(5)
    setWidth(1023)
    expect(q('[data-presentation-toc]')).toBeNull()
    setWidth(1024)
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })

  it('the visible control and P toggle in both directions and keep the active step', () => {
    setWidth(1400)
    render(<Demo />)
    fireEvent.click(screen.getByLabelText('Step 3: Title C'))
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    expect(q('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(q('[data-presentation-title]')?.textContent).toBe('Title C')
    fireEvent.keyDown(window, { key: 'p' })
    expect(q('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('browse')
    expect(q('[data-presentation-title]')?.textContent).toBe('Title C')
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })
})

describe('direct jumps and active state', () => {
  it('progress dots jump to their step and mark exactly the current one', () => {
    render(<Demo />)
    const dots = () => qa('[data-presentation-dot]')
    fireEvent.click(dots()[3])
    expect(q('[data-presentation-title]')?.textContent).toBe('Title D')
    dots().forEach((dot, i) => {
      expect(dot.getAttribute('aria-current')).toBe(i === 3 ? 'step' : null)
      expect(dot.hasAttribute('data-presentation-active')).toBe(i === 3)
    })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(dots()[3].getAttribute('aria-current')).toBeNull()
    expect(dots()[4].getAttribute('aria-current')).toBe('step')
  })

  it('ToC entries jump to the first step of the era, even from later in the era', () => {
    setWidth(1400)
    render(<Demo />)
    const entries = () => qa('[data-presentation-toc-entry]')
    expect(entries().map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
    fireEvent.click(screen.getByLabelText('Step 4: Title D'))
    expect(entries()[1].getAttribute('aria-current')).toBe('step')
    expect(entries()[1].hasAttribute('data-presentation-active')).toBe(true)
    expect(entries()[0].getAttribute('aria-current')).toBeNull()
    fireEvent.click(entries()[1])
    expect(q('[data-presentation-title]')?.textContent).toBe('Title C')
    fireEvent.click(entries()[0])
    expect(q('[data-presentation-title]')?.textContent).toBe('Title A')
    expect(entries()[0].getAttribute('aria-current')).toBe('step')
    expect(entries()[1].getAttribute('aria-current')).toBeNull()
  })

  it('groups only consecutive steps that share an era', () => {
    expect(groupEras(['a', 'a', 'b', 'a'])).toEqual([
      { era: 'a', first: 0, last: 1 },
      { era: 'b', first: 2, last: 2 },
      { era: 'a', first: 3, last: 3 },
    ])
  })
})

describe('attribution and brand', () => {
  it('shows the default made-by link, bottom-right in the footer bar, with a styling hook', () => {
    render(<Demo />)
    const link = q('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe(ATTRIBUTION_HREF)
    expect(link.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    const bar = q('[data-presentation-footer-bar]') as HTMLElement
    expect(bar.lastElementChild).toBe(link)
    expect(link.style.marginLeft).toBe('auto')
    expect(q('[data-presentation-footer]')?.parentElement?.lastElementChild).toBe(q('[data-presentation-footer]'))
  })

  it('also shows it in present mode, supports an override and can be hidden', () => {
    const { unmount } = render(<Demo initialMode="present" />)
    expect(q('[data-presentation-attribution]')).not.toBeNull()
    unmount()
    render(<Demo attribution={{ text: 'by me', href: 'https://example.com/' }} />)
    expect(screen.getByText('by me').getAttribute('href')).toBe('https://example.com/')
    expect(screen.queryByText('made by and-scene')).toBeNull()
  })

  it('hides attribution with null', () => {
    render(<Demo attribution={null} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default top-left brand, but renders a host-provided one in that slot', () => {
    const { unmount } = render(<Demo />)
    const slot = q('[data-presentation-header] [data-presentation-brand]') as HTMLElement
    expect(q('[data-presentation-header]')?.firstElementChild).toBe(slot)
    expect(slot.childNodes).toHaveLength(0)
    expect(within(q('[data-presentation-header]') as HTMLElement).queryByRole('link')).toBeNull()
    unmount()
    render(<Demo brand={<span>Acme</span>} />)
    expect(q('[data-presentation-brand]')?.textContent).toBe('Acme')
  })
})

describe('scene receives its state', () => {
  it('passes payload and stepIndex to the active Scene', () => {
    const seen: Array<[string, number]> = []
    render(
      <Presentation
        title="t"
        steps={[
          { id: 's', era: 'e', title: 'T', caption: 'C', Scene: ({ payload, stepIndex }) => (seen.push([payload.v, stepIndex]), null), payload: { v: 'x' } },
        ]}
      />,
    )
    expect(seen[0]).toEqual(['x', 0])
    expect(OtherScene).toBeTypeOf('function')
  })
})
