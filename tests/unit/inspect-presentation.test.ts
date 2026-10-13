import { describe, expect, it } from 'vitest'
import { evaluateDiagnostics, formatWarning, parseArgs } from '../../scripts/inspect-presentation.mjs'

describe('inspection helper pure logic', () => {
  it('parses slug and inspection options with stable defaults', () => {
    expect(parseArgs(['demo', '--viewport', '390x844', '--settle', '250', '--port', '5174', '--no-build', '--full-page'])).toEqual({ slug: 'demo', viewport: { width: 390, height: 844 }, settle: 250, port: 5174, noBuild: true, fullPage: true })
    expect(parseArgs(['demo']).settle).toBe(1200)
    expect(parseArgs(['demo']).fullPage).toBe(false)
    expect(() => parseArgs(['demo', '--viewport', 'wide'])).toThrow(/viewport/)
  })
  it('runs the same overlap and attribution diagnostics used in the browser', () => {
    document.body.innerHTML = '<main><span id="a">first</span><span id="b">second</span><a data-presentation-attribution>Credit</a></main>'
    const rect = (left: number, top: number, width: number, height: number) => ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) })
    document.querySelector('#a')!.getBoundingClientRect = () => rect(0, 0, 20, 20) as DOMRect
    document.querySelector('#b')!.getBoundingClientRect = () => rect(10, 10, 20, 20) as DOMRect
    document.querySelector('a')!.getBoundingClientRect = () => rect(0, 50, 40, 10) as DOMRect
    const warnings = evaluateDiagnostics()
    expect(warnings.some(warning => warning.includes('overlaps'))).toBe(true)
    expect(warnings).toContain('attribution is too small or browser-default; style the data-presentation-attribution hook (minimum 11px and 24px hit area)')
  })
  it('formats advisory warnings with step context', () => {
    expect(formatWarning(3, 'overlap found')).toBe('WARN [inspect] step 3: overlap found')
  })
})
