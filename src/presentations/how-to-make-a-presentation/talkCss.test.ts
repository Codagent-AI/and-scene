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
    const base = merged('[data-presentation-footer] [data-presentation-progress-item]')
    const active = merged("[data-presentation-footer] [data-presentation-progress-item][data-presentation-active='true']")
    expect(differs(active, base)).toEqual(expect.arrayContaining(['background']))
    expect(differs(active, base).length).toBeGreaterThanOrEqual(2)
    expect(kitText).toContain('data-presentation-progress-item')
    expect(kitText).toContain('data-presentation-active')
  })

  it('keeps the progress dots out of the footer button padding that would inflate them', () => {
    const dot = merged('[data-presentation-footer] [data-presentation-progress-item]')
    expect(dot.padding).toBe('0')
    // `[footer] button` is (0,1,1); a footer-qualified attribute selector is (0,2,0) and wins.
    expect(find('[data-presentation-progress-item]')).toEqual([])
  })

  it('compacts the controls row for phone widths so Next and the mode toggle stay on screen', () => {
    const narrow = /@media \(max-width: 480px\) \{([\s\S]*)\}\s*$/.exec(css)?.[1] ?? ''
    expect(narrow).toMatch(/\[data-presentation-footer\] \{[^}]*padding-left: 16px/)
    expect(narrow).toMatch(/\[data-presentation-progress\] \{[^}]*flex: 1 1 0;[^}]*min-width: 0/)
    expect(narrow).toMatch(/\[data-presentation-progress-item\] \{[^}]*flex: 0 1 8px/)
    // Rough budget at 390px: footer padding 2*16, three ~64px buttons, 3 gaps of 8, dots shrink to fit.
    const fixed = 2 * 16 + 3 * 64 + 3 * 8
    const dots = 8 * 8 + 20 + 8 * 4
    expect(fixed + dots).toBeLessThanOrEqual(390)
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
