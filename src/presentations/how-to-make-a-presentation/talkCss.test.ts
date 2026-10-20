import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const here = path.dirname(new URL(import.meta.url).pathname)
const css = readFileSync(path.join(here, 'talk.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const kitDir = path.join(here, '../../presentation-kit')

interface Rule {
  selectors: string[]
  decls: Record<string, string>
}
const rules: Rule[] = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selectors: m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' ')),
  decls: Object.fromEntries(
    m[2].split(';').map((d) => d.split(/:(.+)/).map((x) => x?.trim())).filter((d) => d[0] && d[1]).map((d) => [d[0], d[1]]),
  ),
}))
const find = (selector: string) => rules.filter((r) => r.selectors.includes(selector))
const merged = (selector: string) => Object.assign({}, ...find(selector).map((r) => r.decls)) as Record<string, string>

const VISUAL = ['background', 'color', 'border-color', 'width', 'font-weight']
const differs = (a: Record<string, string>, b: Record<string, string>) => VISUAL.filter((k) => a[k] !== b[k] && a[k] !== undefined)

describe('sample-owned chrome styling', () => {
  const kitText = ['chrome/Footer.tsx', 'chrome/Toc.tsx', 'chrome/Attribution.tsx']
    .map((f) => readFileSync(path.join(kitDir, f), 'utf8'))
    .join('\n')

  it('makes the active progress entry visibly different from inactive ones', () => {
    const base = merged('[data-presentation-progress-item]')
    const active = merged("[data-presentation-progress-item][data-presentation-active='true']")
    expect(differs(active, base)).toEqual(expect.arrayContaining(['background']))
    expect(differs(active, base).length).toBeGreaterThanOrEqual(2)
    expect(kitText).toContain('data-presentation-progress-item')
    expect(kitText).toContain('data-presentation-active')
  })

  it('makes the active table-of-contents entry visibly different from inactive ones', () => {
    const base = merged('[data-presentation-footer] [data-presentation-toc-item]')
    const active = merged("[data-presentation-footer] [data-presentation-toc-item][data-presentation-active='true']")
    expect(differs(active, base)).toEqual(expect.arrayContaining(['background', 'color']))
    expect(kitText).toContain('data-presentation-toc-item')
  })

  it('makes the attribution legible and not browser-default', () => {
    const a = merged('[data-presentation-attribution]')
    expect(parseFloat(a['font-size'])).toBeGreaterThanOrEqual(11)
    expect(a.color).toBeTruthy()
    expect(a.color).not.toMatch(/^(blue|#00e|#0000ee|rgb\(0, ?0, ?238\))$/i)
    expect(kitText).toContain('data-presentation-attribution')
  })
})
