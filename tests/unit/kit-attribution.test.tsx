import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ComponentType, ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { Anchor, Cpu } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import {
  Appear, Arrow, Box, Emphasis, Frame, Label, Presentation, SceneLayer, SymbolChip, tocEntries,
  type SceneProps, type Step,
} from '../../src/presentation-kit'
import { Toc } from '../../src/presentation-kit/chrome/Toc'
import { Footer } from '../../src/presentation-kit/chrome/Footer'
import { Header } from '../../src/presentation-kit/chrome/Header'
import { Attribution, ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../../src/presentation-kit/chrome/Attribution'


const Scene: ComponentType<SceneProps<undefined>> = () => <Box id="only" x={0} y={0} label="Only" />
const steps: Step[] = [
  { id: 'one', era: 'A', title: 'One', caption: 'first', Scene },
  { id: 'two', era: 'B', title: 'Two', caption: 'second', Scene },
]
const present = (props: Record<string, unknown> = {}) =>
  render(<Presentation steps={steps} title="Deck" {...props} />)

describe('I-14/I-15 default attribution', () => {
  it('reads "made by and-scene" and links to the and-scene repository', () => {
    present()
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(ATTRIBUTION_LABEL).toBe('made by and-scene')
    expect(ATTRIBUTION_HREF).toBe('https://github.com/Codagent-AI/and-scene')
  })

  it('exposes the stable styling hook, exactly once', () => {
    const { container } = present()
    expect(container.querySelectorAll('[data-presentation-attribution]')).toHaveLength(1)
    expect(container.querySelector('a[data-presentation-attribution]')).not.toBeNull()
  })

  it('is placed bottom-right inside a positioned presentation root and adds no visual style', () => {
    const { container } = present()
    const link = container.querySelector<HTMLElement>('[data-presentation-attribution]')!
    expect(link.style.position).toBe('absolute')
    expect(link.style.right).not.toBe('')
    expect(link.style.bottom).not.toBe('')
    expect(link.style.left).toBe('')
    expect(link.style.top).toBe('')
    expect(Array.from({ length: link.style.length }, (_, i) => link.style[i])).toEqual(
      expect.arrayContaining(['position', 'right', 'bottom']),
    )
    expect(link.style.length).toBe(3)
    // Nearest positioned ancestor is the presentation root, so right/bottom mean its corner.
    let ancestor = link.parentElement
    while (ancestor && (ancestor.style.position === '' || ancestor.style.position === 'static')) ancestor = ancestor.parentElement
    expect(ancestor?.hasAttribute('data-presentation-root')).toBe(true)
    expect(ancestor?.style.position).toBe('relative')
  })

  it('can be switched off by the host', () => {
    const { container } = present({ attribution: false })
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})

describe('I-16 top-left brand is opt-in', () => {
  it('has an empty brand slot and no and-scene link in the header by default', () => {
    const { container } = present()
    const header = container.querySelector<HTMLElement>('[data-presentation-header]')!
    const brand = header.querySelector('[data-presentation-brand]')!
    expect(brand.childNodes).toHaveLength(0)
    expect(header.querySelector('a')).toBeNull()
    expect(header.textContent).not.toMatch(/and-scene/i)
  })

  it('renders host-provided brand content only when supplied', () => {
    const { container } = present({ brand: <a href="https://example.test">Host Co</a> })
    const brand = container.querySelector('[data-presentation-header] [data-presentation-brand]')!
    expect(brand.querySelector('a')?.textContent).toBe('Host Co')
    expect(container.querySelectorAll('[data-presentation-header] a')).toHaveLength(1)
  })
})

describe('I-10 stable hooks and author forwarding', () => {
  const author = { className: 'author-class', style: { zIndex: 7 }, 'data-custom': 'yes' } as const
  const primitives: Array<[string, (props: Record<string, unknown>) => ReactElement, string]> = [
    ['Box', (p) => <Box id="e" x={1} y={2} {...p} />, 'box'],
    ['Label', (p) => <Label id="e" x={1} y={2} {...p} />, 'label'],
    ['Frame', (p) => <Frame id="e" x={1} y={2} {...p} />, 'frame'],
    ['Emphasis', (p) => <Emphasis id="e" x={1} y={2} {...p} />, 'emphasis'],
    ['SymbolChip', (p) => <SymbolChip id="e" x={1} y={2} {...p} />, 'symbol-chip'],
    ['Arrow', (p) => <Arrow id="e" from={[0, 0]} to={[10, 10]} {...p} />, 'arrow'],
  ]

  it.each(primitives)('%s: entity hook, kind, and author className/style/data-*', (_name, make, kind) => {
    const { container } = render(make(author))
    const el = container.querySelector<HTMLElement | SVGElement>('[data-presentation-entity]')!
    expect(el.getAttribute('data-presentation-entity')).toBe('e')
    expect(el.getAttribute('data-presentation-kind')).toBe(kind)
    expect(el.getAttribute('class')).toContain('author-class')
    expect(el.getAttribute('data-custom')).toBe('yes')
    expect((el as HTMLElement).style.zIndex).toBe('7')
  })

  it.each(primitives)('%s: author data-* cannot overwrite entity identity or kind', (_name, make, kind) => {
    const { container } = render(make({ 'data-presentation-entity': 'hijack', 'data-presentation-kind': 'hijack' }))
    const el = container.querySelector('[data-presentation-entity]')!
    expect(el.getAttribute('data-presentation-entity')).toBe('e')
    expect(el.getAttribute('data-presentation-kind')).toBe(kind)
  })

  it('Box marks emphasis with a hook and keeps positional geometry beside author style', () => {
    const { container } = render(<Box id="e" x={5} y={6} w={7} h={8} emphasis style={{ zIndex: 2 }} />)
    const el = container.querySelector<HTMLElement>('[data-presentation-entity]')!
    expect(el.getAttribute('data-presentation-emphasis')).toBe('true')
    expect([el.style.left, el.style.top, el.style.width, el.style.height, el.style.zIndex]).toEqual(['5px', '6px', '7px', '8px', '2'])
  })

  it('Appear: hook plus author className/style/data-*, hook not overwritable', () => {
    const { container } = render(
      <Appear className="c" style={{ zIndex: 3 }} data-custom="d" {...({ 'data-presentation-appear': 'x' } as object)}>hi</Appear>,
    )
    const el = container.querySelector<HTMLElement>('[data-presentation-appear]')!
    expect(el.getAttribute('data-presentation-appear')).toBe('')
    expect([el.className, el.style.zIndex, el.getAttribute('data-custom'), el.textContent]).toEqual(['c', '3', 'd', 'hi'])
  })

  it('SceneLayer: hook plus author className/style/data-*', () => {
    const { container } = render(<SceneLayer className="c" style={{ zIndex: 4 }} data-custom="d" />)
    const el = container.querySelector<HTMLElement>('[data-presentation-layer]')!
    expect([el.className, el.style.zIndex, el.getAttribute('data-custom')]).toEqual(['c', '4', 'd'])
  })

  it('chrome parts expose their stable hooks', () => {
    const { container } = present()
    for (const hook of [
      'root', 'header', 'brand', 'era', 'stage', 'canvas', 'scene', 'footer', 'marker', 'title', 'caption',
      'prev', 'next', 'mode-toggle', 'progress', 'progress-item', 'toc', 'toc-item', 'attribution',
    ]) {
      expect(container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
  })

  it('chrome pieces render standalone with their hooks', () => {
    const { container } = render(
      <>
        <Header era="E" />
        <Footer mode="browse" index={0} count={2} title="T" caption="C" stepTitles={['a', 'b']} onJump={vi.fn()} onPrev={vi.fn()} onNext={vi.fn()} onToggleMode={vi.fn()} />
        <Toc entries={tocEntries(steps)} activeIndex={0} onJump={vi.fn()} />
        <Attribution />
      </>,
    )
    for (const hook of ['header', 'footer', 'toc', 'attribution']) {
      expect(container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
  })

  it('chrome parts forward author className/style/data-* without losing hooks or active state', () => {
    const hooks = { className: 'c', style: { zIndex: 7 }, 'data-custom': 'd' }
    const { container } = present({
      chrome: { header: hooks, footer: hooks, toc: hooks, attribution: hooks },
    })
    for (const part of ['header', 'footer', 'toc', 'attribution']) {
      const el = container.querySelector<HTMLElement>(`[data-presentation-${part}]`)!
      expect([el.className, el.style.zIndex, el.getAttribute('data-custom')], part).toEqual(['c', '7', 'd'])
    }
    expect(container.querySelector('[data-presentation-toc-item][data-presentation-active="true"]')).not.toBeNull()
  })

  it('active-state hooks follow the current step on the progress dots and ToC', () => {
    const { container } = present()
    const active = (sel: string) =>
      Array.from(container.querySelectorAll(sel)).map((e) => [e.getAttribute('data-presentation-active'), e.getAttribute('aria-current')])
    expect(active('[data-presentation-progress-item]')).toEqual([['true', 'step'], [null, null]])
    expect(active('[data-presentation-toc-item]')).toEqual([['true', 'step'], [null, null]])
  })
})

describe('X-1 kit is topic-agnostic', () => {
  function sources(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) sources(full, out)
      else if (/\.tsx?$/.test(name)) out.push(full)
    }
    return out
  }
  const kit = resolve(__dirname, '../../src/presentation-kit')

  it('no kit file imports from src/presentations or the app', () => {
    for (const file of sources(kit)) {
      const imports = [...readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!)
      for (const spec of imports) {
        expect(spec, file).not.toMatch(/presentations|Landing|Root|route/)
        if (spec.startsWith('.')) expect(resolve(file, '..', spec).startsWith(kit), `${file} -> ${spec}`).toBe(true)
      }
    }
  })

  it('Box renders a supplied lucide icon component and works without one', () => {
    const { container, rerender } = render(<Box id="i" x={0} y={0} Icon={Anchor} label="L" />)
    const svg = container.querySelector('svg[data-presentation-icon]')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('style')).toBeNull()
    rerender(<Box id="i" x={0} y={0} label="L" />)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.querySelector('[data-presentation-label]')?.textContent).toBe('L')
    rerender(<SymbolChip id="i" x={0} y={0} Icon={Cpu} />)
    expect(container.querySelector('[data-presentation-kind="symbol-chip"] svg')).not.toBeNull()
  })

  it('typed step contract compiles with payload and payload-free steps', () => {
    const Typed: ComponentType<SceneProps<{ n: number }>> = ({ payload }) => <span>{payload.n}</span>
    const typed: Step<{ n: number }> = { id: 't', era: 'e', title: 't', caption: 'c', Scene: Typed, payload: { n: 3 } }
    render(<Presentation steps={[typed]} title="t" />)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
  })
})
