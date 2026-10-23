import { fireEvent, render, renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  actionForKey, clampIndex, swipeAction, usePresentationNav,
} from '../../src/presentation-kit/usePresentationNav'
import { fitScale } from '../../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from '../../src/presentation-kit/constants'
import { touch } from './helpers'

const key = (k: string, target: Element = document.body) => fireEvent.keyDown(target, { key: k })

describe('usePresentationNav', () => {
  it('Right, Space and PageDown advance; Left and PageUp go back (I-20)', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    for (const k of ['ArrowRight', ' ', 'PageDown']) act(() => key(k))
    expect(result.current.index).toBe(3)
    for (const k of ['ArrowLeft', 'PageUp']) act(() => key(k))
    expect(result.current.index).toBe(1)
    expect(actionForKey({ key: 'ArrowRight', ctrlKey: true })).toBeNull()
    expect(actionForKey({ key: 'x' })).toBeNull()
  })

  it('swipe left advances, swipe right goes back, small or vertical drags are ignored (I-21)', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => { touch('touchstart', 300); touch('touchend', 100) })
    expect(result.current.index).toBe(1)
    act(() => { touch('touchstart', 100); touch('touchend', 300) })
    expect(result.current.index).toBe(0)
    act(() => { touch('touchstart', 100, 0); touch('touchend', 120, 0) })
    expect(result.current.index).toBe(0)
    expect(swipeAction(-80, 120)).toBeNull()
    expect(swipeAction(-80, 10)).toBe('next')
    expect(swipeAction(80, 10)).toBe('prev')
  })

  it('clamps at both ends without wrapping (I-25)', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => key('ArrowLeft'))
    expect(result.current.index).toBe(0)
    for (let i = 0; i < 6; i++) act(() => key('ArrowRight'))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
    expect(clampIndex(5, 0)).toBe(0)
  })

  it('P toggles the mode and keeps the step; initialMode is honored (I-19)', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'present'))
    expect(result.current.mode).toBe('present')
    act(() => key('ArrowRight'))
    act(() => key('p'))
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(1)
    act(() => key('P'))
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)
  })

  it('does not hijack keys while an interactive control has focus (I-24)', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    const { getByText, getByRole } = render(
      <div>
        <button>ok</button>
        <a href="#x">link</a>
        <input aria-label="field" />
      </div>,
    )
    for (const el of [getByText('ok'), getByText('link'), getByRole('textbox')]) {
      for (const k of ['ArrowRight', ' ', 'PageDown', 'p']) act(() => key(k, el))
    }
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')
    act(() => key('ArrowRight'))
    expect(result.current.index).toBe(1)
  })
})

describe('fit scale', () => {
  it('scales uniformly by the limiting axis and floors at MIN_SCALE (I-26)', () => {
    expect(fitScale(1760, 1000)).toBe(2)
    expect(fitScale(880, 1000)).toBe(1)
    expect(fitScale(2000, 190)).toBe(0.5)
    expect(fitScale(10, 10)).toBe(MIN_SCALE)
    expect(fitScale(0, 500)).toBe(MIN_SCALE)
  })

  it('defaults to an 880 x 380 canvas with per-mode geometry (I-27)', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
    expect(STAGE_LAYOUT.present.bottom).toBeLessThan(STAGE_LAYOUT.browse.bottom)
    expect(STAGE_LAYOUT.present.tocInset).toBe(0)
  })
})
