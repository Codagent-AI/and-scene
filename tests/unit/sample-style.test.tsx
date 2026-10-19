import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk'
import { setViewport } from './helpers'

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const css = readFileSync(path.join(SAMPLE, 'style.css'), 'utf8')
const kitSource = walk('src/presentation-kit').map((f) => readFileSync(f, 'utf8')).join('\n')
const sceneSource = readFileSync(path.join(SAMPLE, 'Scene.tsx'), 'utf8')

describe('style ownership', () => {
  it('keeps every stylesheet in the host app or a presentation, never in the kit', () => {
    const sheets = walk('src').filter((f) => /\.css$/.test(f)).map((f) => f.split(path.sep).join('/')).sort()
    expect(sheets).toEqual(['src/index.css', `${SAMPLE}/style.css`])
  })

  it('styles through plain CSS scoped to the presentation root class', () => {
    const selectors = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/^([^@{}\n][^{}]*)\{/gm)].flatMap((m) => m[1].split(',').map((s) => s.trim()))
    expect(selectors.every((s) => s.startsWith('.hmp'))).toBe(true)
    expect(readFileSync(path.join(SAMPLE, 'Talk.tsx'), 'utf8')).toMatch(/className="hmp"/)
  })

  it('targets only hooks the kit emits and classes the scene applies', () => {
    for (const hook of new Set(css.match(/data-presentation-[a-z-]+/g))) {
      expect(kitSource, hook).toContain(hook)
    }
    for (const cls of new Set([...css.matchAll(/\.(hmp-[a-z-]+)/g)].map((m) => m[1]))) {
      expect(sceneSource, cls).toContain(cls)
    }
  })

  it('has a responsive rule for narrow viewports', () => {
    expect(css).toMatch(/@media \(max-width: \d+px\)/)
  })
})

describe('active chrome and attribution are styled locally', () => {
  let style: HTMLStyleElement | undefined
  afterEach(() => style?.remove())

  function mount() {
    style = document.createElement('style')
    // jsdom does not evaluate media queries, so only the base rules are injected
    style.textContent = css.replace(/@media[\s\S]*$/, '')
    document.head.appendChild(style)
    setViewport(1440, 900)
    render(<Talk />)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-dot]')[2])
  }
  const computed = (el: Element) => getComputedStyle(el)

  it('makes the active progress dot and ToC entry visibly different from inactive ones', () => {
    mount()
    const dots = [...document.querySelectorAll('[data-presentation-progress-dot]')]
    const active = dots.find((d) => d.hasAttribute('data-presentation-active'))!
    const inactive = dots.find((d) => !d.hasAttribute('data-presentation-active'))!
    // jsdom cannot resolve var() colours, so compare the literal geometry the active rule changes
    expect(computed(active).width).toBe('26px')
    expect(computed(inactive).width).toBe('10px')
    const entries = [...document.querySelectorAll('[data-presentation-toc-entry]')]
    const activeEntry = entries.find((e) => e.hasAttribute('data-presentation-active'))!
    const otherEntry = entries.find((e) => !e.hasAttribute('data-presentation-active'))!
    expect(computed(activeEntry).fontWeight).toBe('700')
    expect(computed(otherEntry).fontWeight).not.toBe('700')
  })

  it('renders a legible, non-default attribution', () => {
    mount()
    const link = document.querySelector('[data-presentation-attribution]')!
    const size = computed(link).fontSize
    const px = size.endsWith('rem') ? parseFloat(size) * 16 : parseFloat(size)
    expect(px).toBeGreaterThanOrEqual(11)
    expect(computed(link).textDecoration).not.toMatch(/underline/)
    expect(computed(link).color).not.toBe('rgb(0, 0, 238)')
  })
})
