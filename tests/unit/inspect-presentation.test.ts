import { describe, expect, it } from 'vitest'
import { attributionNeedsWarning, formatWarning, intersects, parseArgs } from '../../scripts/inspect-presentation.mjs'

describe('inspection helper pure logic', () => {
  it('parses slug and inspection options with stable defaults', () => {
    expect(parseArgs(['demo', '--viewport', '390x844', '--settle', '250', '--port', '5174', '--no-build'])).toEqual({ slug: 'demo', viewport: { width: 390, height: 844 }, settle: 250, port: 5174, noBuild: true })
    expect(parseArgs(['demo']).settle).toBe(1200)
    expect(() => parseArgs(['demo', '--viewport', 'wide'])).toThrow(/viewport/)
  })
  it('detects only positive-area box intersections', () => {
    expect(intersects({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 9, top: 9, right: 20, bottom: 20 })).toBe(true)
    expect(intersects({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 10, top: 0, right: 20, bottom: 10 })).toBe(false)
  })
  it('flags small attribution and formats advisory warnings with step context', () => {
    expect(attributionNeedsWarning({ fontSize: 10, width: 100, height: 24, color: 'rgb(1, 2, 3)', textDecoration: 'none', authorStyle: true })).toBe(true)
    expect(attributionNeedsWarning({ fontSize: 12, width: 100, height: 24, color: 'rgb(1, 2, 3)', textDecoration: 'none', authorStyle: true })).toBe(false)
    expect(formatWarning(3, 'overlap found')).toBe('WARN [inspect] step 3: overlap found')
  })
})
