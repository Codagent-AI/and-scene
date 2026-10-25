import { describe, expect, it } from 'vitest'
import { isInteractiveTarget, keyToAction, navReducer, swipeToAction } from './nav.ts'

const at = (index: number, mode: 'present' | 'browse' = 'present') => ({ index, mode })

describe('navReducer', () => {
  it('advances and goes back one step', () => {
    expect(navReducer(at(2), { type: 'next' }, 5).index).toBe(3)
    expect(navReducer(at(2), { type: 'prev' }, 5).index).toBe(1)
  })

  it('clamps at the first step', () => {
    expect(navReducer(at(0), { type: 'prev' }, 5).index).toBe(0)
  })

  it('clamps at the last step', () => {
    expect(navReducer(at(4), { type: 'next' }, 5).index).toBe(4)
  })

  it('clamps direct jumps into range', () => {
    expect(navReducer(at(1), { type: 'goto', index: 99 }, 5).index).toBe(4)
    expect(navReducer(at(1), { type: 'goto', index: -3 }, 5).index).toBe(0)
    expect(navReducer(at(1), { type: 'goto', index: 3 }, 5).index).toBe(3)
  })

  it('toggles the mode and keeps the step', () => {
    const toggled = navReducer(at(3, 'browse'), { type: 'toggle-mode' }, 5)
    expect(toggled).toEqual({ index: 3, mode: 'present' })
    expect(navReducer(toggled, { type: 'toggle-mode' }, 5)).toEqual({ index: 3, mode: 'browse' })
  })
})

describe('keyToAction', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances', (key) => {
    expect(keyToAction(key)).toEqual({ type: 'next' })
  })
  it.each(['ArrowLeft', 'PageUp'])('%s goes back', (key) => {
    expect(keyToAction(key)).toEqual({ type: 'prev' })
  })
  it('maps P to the mode toggle', () => {
    expect(keyToAction('p')).toEqual({ type: 'toggle-mode' })
    expect(keyToAction('P')).toEqual({ type: 'toggle-mode' })
  })
  it('ignores other keys', () => {
    expect(keyToAction('a')).toBeNull()
    expect(keyToAction('Enter')).toBeNull()
  })
})

describe('swipeToAction', () => {
  it('swipe left advances and swipe right goes back', () => {
    expect(swipeToAction(-120, 5, 50)).toEqual({ type: 'next' })
    expect(swipeToAction(120, -5, 50)).toEqual({ type: 'prev' })
  })
  it('ignores short and mostly vertical swipes', () => {
    expect(swipeToAction(-20, 0, 50)).toBeNull()
    expect(swipeToAction(-80, 120, 50)).toBeNull()
  })
})

describe('isInteractiveTarget', () => {
  it('treats buttons, links, inputs, and their descendants as interactive', () => {
    document.body.innerHTML = '<button><span id="in">x</span></button><a href="#">l</a><input /><div id="plain"></div>'
    expect(isInteractiveTarget(document.getElementById('in'))).toBe(true)
    expect(isInteractiveTarget(document.querySelector('a'))).toBe(true)
    expect(isInteractiveTarget(document.querySelector('input'))).toBe(true)
    expect(isInteractiveTarget(document.getElementById('plain'))).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })
})
