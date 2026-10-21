import { describe, expect, it } from 'vitest'
import { DEFAULTS, parseArgs, screenshotName } from './inspect-args.mjs'

describe('parseArgs', () => {
  it('defaults to a standard desktop viewport and a settle interval', () => {
    const options = parseArgs(['my-talk'])
    expect(options).toMatchObject({ slug: 'my-talk', settleMs: DEFAULTS.settleMs, width: 1440, height: 900, skipBuild: false, out: null })
    expect(DEFAULTS.width).toBeGreaterThanOrEqual(1280)
    expect(DEFAULTS.height).toBeGreaterThanOrEqual(720)
    expect(DEFAULTS.settleMs).toBeGreaterThan(1050) // longer than the slowest entrance animation
  })
  it('reads the configured settle interval, viewport and output directory', () => {
    expect(parseArgs(['s', '--settle', '250', '--viewport', '480x800', '--out', 'x', '--skip-build'])).toMatchObject({
      settleMs: 250, width: 480, height: 800, out: 'x', skipBuild: true,
    })
  })
  it.each([[[]], [['s', '--settle', 'soon']], [['s', '--settle', '-1']], [['s', '--viewport', 'wide']], [['s', '--nope']], [['a', 'b']]])(
    'rejects invalid arguments %j',
    (argv) => expect(() => parseArgs(argv)).toThrow(),
  )
})

describe('screenshotName', () => {
  it('derives a predictable one-based, zero-padded name', () => {
    expect(screenshotName(0)).toBe('step-01.png')
    expect(screenshotName(11)).toBe('step-12.png')
  })
})
