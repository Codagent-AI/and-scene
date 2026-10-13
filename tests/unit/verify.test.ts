import { describe, expect, it } from 'vitest'
import { compareOutline, formatFailure, parseArgs, parsePresentationRoutes } from '../../scripts/verify.mjs'

const outline = [{ era: 'one', title: 'A', caption: 'words' }]

describe('verification helpers', () => {
  it('accepts an exact outline and reports the first mismatch', () => {
    expect(compareOutline(outline, outline)).toBeUndefined()
    expect(compareOutline(outline, [{ ...outline[0], title: 'B' }])).toContain('step 0: title')
    expect(compareOutline(outline, [])).toContain('expected 1 steps')
  })
  it('parses explicit ports and rejects malformed arguments', () => {
    expect(parseArgs(['--port', '4179'])).toEqual({ port: 4179, skipBuild: false })
    expect(() => parseArgs(['--port', '70000'])).toThrow('--port')
    expect(() => parseArgs(['--unknown'])).toThrow('Unknown argument')
  })
  it('formats phase-specific failures unambiguously', () => {
    expect(formatFailure('render', 'step 4 failed')).toBe('FAIL [render] step 4 failed')
  })
  it('parses quoted presentation slugs and rejects an empty registry', () => {
    expect(parsePresentationRoutes("{ slug: 'single' }, { slug: \"double\" }, { \"slug\": 'quoted-key' }"))
      .toEqual([{ slug: 'single' }, { slug: 'double' }, { slug: 'quoted-key' }])
    expect(() => parsePresentationRoutes('export const presentations = []'))
      .toThrow('no presentation slugs found in src/presentations/index.ts')
  })
})
