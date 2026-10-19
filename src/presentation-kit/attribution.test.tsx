import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

function Scene({ payload }: SceneProps<string>) {
  return <div data-testid="scene">{payload}</div>
}

const steps: Step<string>[] = ['a', 'b'].map((payload, i) => ({
  id: `s${i}`,
  era: 'E',
  title: `Title ${i}`,
  caption: `Caption ${i}`,
  groupKey: 'g',
  Scene,
  payload,
}))

const DEFAULT_HREF = 'https://github.com/Codagent-AI/and-scene'

function root(): HTMLElement {
  return document.querySelector('[data-presentation-root]') as HTMLElement
}

function header(): HTMLElement {
  return document.querySelector('[data-presentation-header]') as HTMLElement
}

afterEach(() => {
  cleanup()
})

describe('L-9: bottom-right attribution', () => {
  it('L-9: the default attribution is a bottom-right link reading "made by and-scene" to the repository', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' }) as HTMLAnchorElement
    expect(link.tagName).toBe('A')
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe(DEFAULT_HREF)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noreferrer')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
  })

  it('L-9: the default attribution is positioned at the bottom-right of the fixed presentation root', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const link = document.querySelector('[data-presentation-attribution]') as HTMLElement
    expect(link.parentElement).toBe(root())
    const cs = window.getComputedStyle(link)
    expect(cs.position).toBe('absolute')
    expect(parseFloat(cs.right)).toBe(0)
    expect(parseFloat(cs.bottom)).toBe(0)
    expect(window.getComputedStyle(root()).position).toBe('fixed')
  })

  it('L-9: the attribution renders in browse mode too', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe(DEFAULT_HREF)
  })

  it('L-9: an attribution option overrides the label and href and replaces the default', () => {
    render(
      <Presentation
        steps={steps}
        title="Deck"
        attribution={{ label: 'Acme deck', href: 'https://example.com/acme' }}
      />,
    )
    const link = screen.getByRole('link', { name: 'Acme deck' })
    expect(link.getAttribute('href')).toBe('https://example.com/acme')
    expect(screen.queryByRole('link', { name: 'made by and-scene' })).toBeNull()
    expect(document.querySelectorAll('[data-presentation-attribution]')).toHaveLength(1)
  })

  it('L-9: a partial override keeps the default href when only the label is given', () => {
    render(<Presentation steps={steps} title="Deck" attribution={{ label: 'Custom label' }} />)
    const link = screen.getByRole('link', { name: 'Custom label' })
    expect(link.getAttribute('href')).toBe(DEFAULT_HREF)
  })

  it('L-9: attribution null removes the attribution entirely', () => {
    render(<Presentation steps={steps} title="Deck" attribution={null} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})

describe('L-10: header brand slot', () => {
  it('L-10: without a host brand the header brand slot is empty and no and-scene branding is in the header', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const slot = header().querySelector('[data-presentation-brand]') as HTMLElement
    expect(slot).not.toBeNull()
    expect(slot.childNodes).toHaveLength(0)
    expect(slot.textContent).toBe('')
    expect(header().textContent).not.toMatch(/and-scene/i)
    expect(header().querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('L-10: a host-supplied brand renders in the header brand slot while the bottom-right attribution stays outside the header', () => {
    render(<Presentation steps={steps} title="Deck" brand={<span data-testid="host-brand">Acme Co</span>} />)
    const slot = header().querySelector('[data-presentation-brand]') as HTMLElement
    const brand = within(slot).getByTestId('host-brand')
    expect(brand.textContent).toBe('Acme Co')
    expect(header().contains(brand)).toBe(true)
    const attr = screen.getByRole('link', { name: 'made by and-scene' })
    expect(header().contains(attr)).toBe(false)
    expect(attr.parentElement).toBe(root())
  })
})
