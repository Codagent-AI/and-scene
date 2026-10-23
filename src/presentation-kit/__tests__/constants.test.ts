import { describe, expect, it } from 'vitest'
import {
  ATTRIBUTION_TEXT,
  ATTRIBUTION_URL,
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  LAYOUT_T,
  MIN_SCALE,
  STAGE_LAYOUT,
  SWIPE_DOMINANCE,
  SWIPE_MIN_PX,
  WIDE_VIEWPORT_MIN,
} from '../constants'

describe('kit constants', () => {
  it('uses the 880 by 380 default design canvas', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('exports per-mode stage geometry for browse and present', () => {
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('delays newcomers until persisting entities have finished moving', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('pins the swipe and wide-viewport thresholds', () => {
    expect(SWIPE_MIN_PX).toBe(40)
    expect(SWIPE_DOMINANCE).toBe(1.5)
    expect(WIDE_VIEWPORT_MIN).toBe(1024)
    expect(MIN_SCALE).toBeGreaterThan(0)
  })

  it('pins the attribution link text and repository URL', () => {
    expect(ATTRIBUTION_TEXT).toBe('made by and-scene')
    expect(ATTRIBUTION_URL).toBe('https://github.com/Codagent-AI/and-scene')
  })
})
