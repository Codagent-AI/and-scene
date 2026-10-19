import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(import.meta.dirname, 'styles.css'), 'utf8')

interface Rule {
  selector: string
  decls: Map<string, string>
}

function parse(source: string): Rule[] {
  const rules: Rule[] = []
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = new Map<string, string>()
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':')
      if (i > 0) decls.set(d.slice(0, i).trim(), d.slice(i + 1).trim())
    }
    rules.push({ selector: m[1].trim(), decls })
  }
  return rules
}

const rules = parse(css)
const forSelector = (re: RegExp) => rules.filter((r) => re.test(r.selector))

const GEOMETRY = [
  'position', 'left', 'right', 'top', 'bottom', 'inset', 'width', 'height', 'min-width', 'min-height',
  'max-width', 'max-height', 'transform', 'translate', 'scale', 'rotate', 'margin', 'zoom', 'flex-basis',
]

describe('presentation-local CSS has no geometry overrides of entities (L-46)', () => {
  it('never keys a rule on step index or a single entity id', () => {
    for (const r of rules) {
      expect(r.selector, r.selector).not.toMatch(/step-index|presentation-entity=|how-to-make-a-presentation\//)
    }
  })

  it('never declares geometry on a rule that targets an entity element itself', () => {
    const entityRoot = /(\[data-presentation-kind[^\]]*\]|\.sample-[a-z-]+)$/
    for (const r of rules) {
      for (const sel of r.selector.split(',').map((s) => s.trim())) {
        if (!entityRoot.test(sel) || sel.includes('::')) continue
        const bad = GEOMETRY.filter((p) => r.decls.has(p))
        expect(bad, `${sel} declares ${bad.join(',')}`).toEqual([])
      }
    }
  })
})

describe('active chrome and attribution are styled locally (L-40)', () => {
  const distinguishing = ['color', 'background', 'background-color', 'border-color', 'font-weight', 'box-shadow']

  it.each([
    ['progress', /\[data-presentation-progress-item\]\[data-presentation-active\]/, /^\[data-presentation-progress-item\]$/],
    ['table of contents', /\[data-presentation-toc-item\]\[data-presentation-active\]/, /^\[data-presentation-toc-item\]$/],
  ])('%s: the active state differs from the inactive state', (_name, active, inactive) => {
    const a = forSelector(active)
    expect(a.length).toBeGreaterThan(0)
    expect(forSelector(/\[aria-current\]/).length).toBeGreaterThan(0)
    const base = rules.find((r) => inactive.test(r.selector))
    expect(base).toBeDefined()
    const differing = distinguishing.filter((p) => {
      const v = a.map((r) => r.decls.get(p)).find((x) => x !== undefined)
      return v !== undefined && v !== base?.decls.get(p)
    })
    expect(differing.length).toBeGreaterThanOrEqual(2)
  })

  it('styles the attribution legibly: bottom-right sizing, readable size, non-default font and color', () => {
    const attr = rules.find((r) => r.selector === '[data-presentation-attribution]')
    expect(attr).toBeDefined()
    const font = attr?.decls.get('font') ?? ''
    expect(font).toMatch(/\b1[2-9]px\b/)
    expect(font).toMatch(/var\(--sans\)/)
    expect(attr?.decls.get('color')).toBeTruthy()
    expect(attr?.decls.get('color')).not.toMatch(/0000ee/i)
    expect(attr?.decls.get('text-decoration')).toBe('none')
    expect(attr?.decls.get('padding')).toBeTruthy()
  })
})

describe('dashed and green treatments are supplied by local CSS', () => {
  it('draws the ghost card dashed and the pass check/verify node green', () => {
    expect(forSelector(/^\.sample-ghost$/)[0]?.decls.get('border')).toMatch(/dashed/)
    expect(css).toMatch(/--pass:\s*#1a9150/)
    expect(forSelector(/^\.sample-pass$/)[0]?.decls.get('background')).toBe('var(--pass)')
    expect(forSelector(/sample-verify\[data-presentation-state='pass'\]/)[0]?.decls.get('border-color')).toBe('var(--pass)')
  })
})
