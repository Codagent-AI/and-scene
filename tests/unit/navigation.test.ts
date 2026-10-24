import { describe, expect, it } from 'vitest'
import { SWIPE_MIN, clampIndex, isInteractiveTarget, keyAction, swipeAction } from '../../src/presentation-kit'

describe('navigation helpers', () => {
  it.each([
    ['ArrowRight', 'next'],
    [' ', 'next'],
    ['PageDown', 'next'],
    ['ArrowLeft', 'prev'],
    ['PageUp', 'prev'],
    ['p', 'toggle-mode'],
    ['P', 'toggle-mode'],
    ['Enter', null],
    ['ArrowDown', null],
  ])('maps key %j to %j', (key, action) => {
    expect(keyAction(key)).toBe(action)
  })

  it('clamps indices at both ends and for out-of-range or invalid jumps', () => {
    expect(clampIndex(-1, 9)).toBe(0)
    expect(clampIndex(0, 9)).toBe(0)
    expect(clampIndex(8, 9)).toBe(8)
    expect(clampIndex(9, 9)).toBe(8)
    expect(clampIndex(99, 9)).toBe(8)
    expect(clampIndex(Number.NaN, 9)).toBe(0)
    expect(clampIndex(3, 0)).toBe(0)
  })

  it('swipes only when horizontal travel reaches the minimum and exceeds vertical travel', () => {
    expect(SWIPE_MIN).toBe(50)
    expect(swipeAction(-49, 0)).toBeNull()
    expect(swipeAction(-50, 0)).toBe('next')
    expect(swipeAction(50, 0)).toBe('prev')
    expect(swipeAction(-120, 119)).toBe('next')
    expect(swipeAction(-120, 120)).toBeNull()
    expect(swipeAction(-120, 200)).toBeNull()
    expect(swipeAction(120, -121)).toBeNull()
  })

  it('treats controls and their descendants as interactive', () => {
    const host = document.createElement('div')
    host.innerHTML =
      '<button><span id="in">x</span></button><a href="#">l</a><a id="bare">no href</a><input><select></select><textarea></textarea><div contenteditable="true" id="ed"></div><div id="plain"></div>'
    const q = (s: string) => host.querySelector(s)
    expect(isInteractiveTarget(q('#in'))).toBe(true)
    for (const sel of ['button', 'a[href]', 'input', 'select', 'textarea', '#ed']) {
      expect(isInteractiveTarget(q(sel)), sel).toBe(true)
    }
    expect(isInteractiveTarget(q('#bare'))).toBe(false)
    expect(isInteractiveTarget(q('#plain'))).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
    expect(isInteractiveTarget(window)).toBe(false)
  })
})
