import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}

const originalWidth = window.innerWidth
const originalHeight = window.innerHeight

afterEach(() => {
  setViewport(originalWidth, originalHeight)
})

describe('useFitScale', () => {
  it('scales uniformly to fit the design canvas within the available viewport', () => {
    setViewport(1760, 760 + STAGE_LAYOUT.browse.topGap + STAGE_LAYOUT.browse.bottomGap)
    const { result } = renderHook(() => useFitScale('browse'))
    // width allows scale 2, height allows scale 2 exactly -> uniform scale 2
    expect(result.current).toBeCloseTo(2, 5)
  })

  it('picks the smaller of the width- and height-constrained scales', () => {
    setViewport(DESIGN_W, 10000)
    const { result } = renderHook(() => useFitScale('present'))
    expect(result.current).toBeCloseTo(1, 5)
  })

  it('never scales below MIN_SCALE even in a very small viewport', () => {
    setViewport(10, 10)
    const { result } = renderHook(() => useFitScale('browse'))
    expect(result.current).toBe(MIN_SCALE)
  })

  it('recomputes when the viewport resizes', () => {
    setViewport(DESIGN_W, DESIGN_H + STAGE_LAYOUT.present.topGap + STAGE_LAYOUT.present.bottomGap)
    const { result } = renderHook(() => useFitScale('present'))
    expect(result.current).toBeCloseTo(1, 5)

    act(() => {
      setViewport(DESIGN_W / 2, DESIGN_H / 2 + STAGE_LAYOUT.present.topGap + STAGE_LAYOUT.present.bottomGap)
    })
    expect(result.current).toBeCloseTo(0.5, 5)
  })

  it('uses distinct gaps for browse vs present mode', () => {
    const height = 700
    setViewport(2000, height)
    const { result: browse } = renderHook(() => useFitScale('browse'))
    const { result: present } = renderHook(() => useFitScale('present'))
    const browseAvail = height - STAGE_LAYOUT.browse.topGap - STAGE_LAYOUT.browse.bottomGap
    const presentAvail = height - STAGE_LAYOUT.present.topGap - STAGE_LAYOUT.present.bottomGap
    expect(browse.current).toBeCloseTo(browseAvail / DESIGN_H, 5)
    expect(present.current).toBeCloseTo(presentAvail / DESIGN_H, 5)
    expect(present.current).toBeGreaterThan(browse.current)
  })
})
