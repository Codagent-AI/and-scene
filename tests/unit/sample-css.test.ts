import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { read, ROOT } from './helpers'

const css = read(ROOT, 'src/presentations/how-to-make-a-presentation/talk.css')

function declarations(selector: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (sel.split(',').map((s) => s.trim()).includes(selector))
      for (const d of body.split(';')) {
        const [k, ...v] = d.split(':')
        if (k.trim() && v.length) out[k.trim()] = v.join(':').trim()
      }
  }
  return out
}

const VISUAL = ['color', 'background', 'border-color', 'font-weight', 'width', 'height', 'opacity', 'border-radius']

describe('sample stylesheet', () => {
  it.each([
    ['progress', '.htmp [data-presentation-progress-item]', ".htmp [data-presentation-progress-item][data-presentation-active='true']"],
    ['table of contents', '.htmp [data-presentation-toc-entry]', ".htmp [data-presentation-toc-entry][data-presentation-active='true']"],
  ])('makes the active %s entry visibly different from inactive ones', (_n, base, active) => {
    const b = declarations(base)
    const a = declarations(active)
    expect(Object.keys(a).length).toBeGreaterThan(0)
    const differing = VISUAL.filter((k) => k in a && a[k] !== b[k])
    expect(differing.length).toBeGreaterThan(0)
  })

  it('styles the attribution legibly', () => {
    const a = declarations('.htmp [data-presentation-attribution]')
    expect(parseFloat(a['font-size'])).toBeGreaterThanOrEqual(12)
    expect(a.color).toBeDefined()
    expect(a.color).not.toMatch(/#00e|rgb\(0,\s*0,\s*238\)|blue/i)
  })

  it('lives next to the presentation, never in the kit', () => {
    expect(path.relative(ROOT, path.join(ROOT, 'src/presentations/how-to-make-a-presentation/talk.css'))).toMatch(/^src\/presentations\//)
  })

  it('styles the intentional pass-check overlap by entity, not by disabling checks globally', () => {
    expect(css).not.toMatch(/allow-overlap/)
  })
})
