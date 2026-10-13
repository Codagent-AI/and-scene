import { describe, expect, it } from 'vitest'
import { compareOutline, formatFailure, parseArgs } from '../../scripts/verify.mjs'

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
})
