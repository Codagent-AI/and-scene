import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROOT } from './helpers'

describe('sample styling is presentation-owned', () => {
  const dir = path.join(ROOT, 'src/presentations/how-to-make-a-presentation')
  const css = readFileSync(path.join(dir, 'talk.css'), 'utf8')
  const rule = (selector: string) => {
    const match = css.split('}').find((block: string) => block.split('{')[0].includes(selector))
    return match ? match.split('{')[1] : ''
  }

  it('is imported by the presentation entry, not by the kit', () => {
    expect(readFileSync(path.join(dir, 'Talk.tsx'), 'utf8')).toContain("import './talk.css'")
  })

  it('makes the active progress item and ToC entry visibly different from inactive ones', () => {
    const active = rule('[data-presentation-progress-item][data-presentation-active]')
    expect(active).toMatch(/background:\s*var\(--accent\)/)
    expect(active).toMatch(/font-weight:\s*700/)
    expect(rule('.htmp button')).toMatch(/background:\s*transparent/)
    expect(css).toContain('[data-presentation-toc-entry][data-presentation-active]')
  })

  it('styles the attribution with legible authored typography', () => {
    const attribution = rule('.htmp [data-presentation-attribution]')
    expect(Number(/font-size:\s*(\d+)px/.exec(attribution)?.[1])).toBeGreaterThanOrEqual(11)
    expect(attribution).toMatch(/text-decoration:\s*none/)
    expect(attribution).toMatch(/color:/)
  })
})
