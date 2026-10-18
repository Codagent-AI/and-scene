import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  path.resolve(import.meta.dirname, '../../src/presentations/how-to-make-a-presentation/talk.css'),
  'utf8',
)
const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => ({
  selector: selector.replace(/\/\*[\s\S]*?\*\//g, '').trim(),
  size: Number(/font-size:\s*(\d+(?:\.\d+)?)px/.exec(body)?.[1]),
}))
const sceneRules = rules.filter((r) => Number.isFinite(r.size) && /data-presentation-(node|id|ghost)|data-part/.test(r.selector))

// The 880 x 380 canvas is scaled to ~0.39 at a 390px viewport, so diagram text is sized in design units.
const MIN_DESIGN_PX = 12

describe('sample diagram text stays legible when the canvas is scaled down', () => {
  it('sets a base node size well above chrome-sized text', () => {
    const base = rules.find((r) => r.selector.endsWith("[data-presentation-node]"))
    expect(base?.size).toBeGreaterThanOrEqual(16)
  })

  it('declares no diagram text below the minimum design size', () => {
    expect(sceneRules.length).toBeGreaterThan(5)
    for (const r of sceneRules) expect(r.size, r.selector).toBeGreaterThanOrEqual(MIN_DESIGN_PX)
  })
})
