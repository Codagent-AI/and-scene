import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ATTRIBUTION_URL, Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

type Payload = { label: string }

const Scene = ({ payload }: SceneProps<Payload>) => <div data-testid="scene">{payload.label}</div>

const steps: Step<Payload>[] = [
  { id: 'a', era: 'Intro', title: 'Start here', caption: 'First caption.', Scene, payload: { label: 'p-a' } },
  { id: 'b', era: 'Intro', title: 'Second', caption: 'Second caption.', Scene, payload: { label: 'p-b' } },
  { id: 'c', era: 'Core', title: 'Third', caption: 'Third caption.', Scene, payload: { label: 'p-c' } },
]

const attributionLinks = () => document.querySelectorAll<HTMLAnchorElement>('[data-presentation-attribution]')

afterEach(() => {
  cleanup()
})

describe('L-13 default bottom-right attribution', () => {
  it.each(['browse', 'present'] as const)('renders one default link in %s mode', (mode) => {
    render(<Presentation steps={steps} title="Deck" initialMode={mode} />)

    const links = attributionLinks()
    expect(links).toHaveLength(1)
    const link = links[0]
    expect(link.tagName).toBe('A')
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(ATTRIBUTION_URL).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
  })

  it('is placed in the bottom-right corner through its own geometry', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const link = attributionLinks()[0]
    const style = getComputedStyle(link)
    expect(style.position).toBe('fixed')
    expect(style.right).toMatch(/^0(px)?$/)
    expect(style.bottom).toMatch(/^0(px)?$/)
    // Only right/bottom are anchored; top/left are unset (jsdom reports 'auto').
    expect(['', 'auto']).toContain(style.top)
    expect(['', 'auto']).toContain(style.left)
  })

  it('lives in the footer and no ancestor creates a containing block that would move the fixed corner', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const link = attributionLinks()[0]
    expect(link.closest('[data-presentation-footer]')).not.toBeNull()

    // A transform/filter/perspective/contain ancestor would re-anchor position:fixed away from the viewport corner.
    for (let el: HTMLElement | null = link.parentElement; el; el = el.parentElement) {
      const cs = getComputedStyle(el)
      expect(cs.transform === '' || cs.transform === 'none').toBe(true)
      expect(cs.filter === '' || cs.filter === 'none').toBe(true)
      expect(cs.perspective === '' || cs.perspective === 'none').toBe(true)
    }
  })

  it('keeps the attribution after navigation in both modes', () => {
    render(<Presentation steps={steps} title="Deck" />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(attributionLinks()).toHaveLength(1)
    fireEvent.keyDown(document.body, { key: 'p' })
    expect(attributionLinks()).toHaveLength(1)
  })
})

describe('X-2 attribution options', () => {
  it('attribution={false} hides the default link entirely', () => {
    render(<Presentation steps={steps} title="Deck" attribution={false} />)
    expect(attributionLinks()).toHaveLength(0)
    expect(document.querySelector('a[href="https://github.com/Codagent-AI/and-scene"]')).toBeNull()
    expect(document.body.textContent).not.toContain('made by and-scene')
  })

  it('a custom node replaces the default link and no default link is duplicated', () => {
    render(
      <Presentation
        steps={steps}
        title="Deck"
        attribution={<span data-testid="custom-credit">Credits: host</span>}
      />,
    )
    expect(attributionLinks()).toHaveLength(0)
    expect(document.querySelectorAll('[data-testid="custom-credit"]')).toHaveLength(1)
    expect(document.body.textContent).not.toContain('made by and-scene')
    expect(document.querySelector('a[href="https://github.com/Codagent-AI/and-scene"]')).toBeNull()
  })

  it('with no override the default link uses the safe link relationship', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const rel = (attributionLinks()[0].getAttribute('rel') ?? '').split(/\s+/)
    expect(rel).toContain('noopener')
    expect(rel).toContain('noreferrer')
    expect(document.querySelectorAll('a[href="https://github.com/Codagent-AI/and-scene"]')).toHaveLength(1)
  })
})
