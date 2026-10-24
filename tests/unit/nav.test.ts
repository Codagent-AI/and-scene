import { describe, expect, it } from 'vitest'
import { isInteractiveTarget, keyAction, navReducer, swipeAction } from '../../src/presentation-kit/nav.ts'
import type { NavState } from '../../src/presentation-kit/nav.ts'

const reduce = navReducer(3)
const at = (index: number): NavState => ({ index, mode: 'browse' })

describe('navReducer', () => {
  it('advances and goes back one step', () => {
    expect(reduce(at(0), { type: 'next' }).index).toBe(1)
    expect(reduce(at(2), { type: 'prev' }).index).toBe(1)
  })

  it('clamps at the start and the end without wrapping', () => {
    expect(reduce(at(0), { type: 'prev' }).index).toBe(0)
    expect(reduce(at(2), { type: 'next' }).index).toBe(2)
    expect(reduce(at(1), { type: 'goTo', index: 99 }).index).toBe(2)
    expect(reduce(at(1), { type: 'goTo', index: -4 }).index).toBe(0)
  })

  it('toggles mode while staying on the current step', () => {
    const next = reduce(at(1), { type: 'toggleMode' })
    expect(next).toEqual({ index: 1, mode: 'present' })
    expect(reduce(next, { type: 'toggleMode' })).toEqual({ index: 1, mode: 'browse' })
  })
})

describe('keyAction', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%s advances', (key) => {
    expect(keyAction({ key })).toEqual({ type: 'next' })
  })
  it.each(['ArrowLeft', 'PageUp'])('%s goes back', (key) => {
    expect(keyAction({ key })).toEqual({ type: 'prev' })
  })
  it('P toggles the mode; other keys and modified keys are ignored', () => {
    expect(keyAction({ key: 'p' })).toEqual({ type: 'toggleMode' })
    expect(keyAction({ key: 'x' })).toBeNull()
    expect(keyAction({ key: 'ArrowRight', metaKey: true })).toBeNull()
  })
})

describe('swipeAction', () => {
  it('left advances, right goes back', () => {
    expect(swipeAction(-120, 5)).toEqual({ type: 'next' })
    expect(swipeAction(120, -5)).toEqual({ type: 'prev' })
  })
  it('ignores short or mostly vertical drags', () => {
    expect(swipeAction(-20, 0)).toBeNull()
    expect(swipeAction(-80, 200)).toBeNull()
  })
})

describe('isInteractiveTarget', () => {
  it('treats controls (and their children) as interactive but not plain content', () => {
    document.body.innerHTML = '<button><span id="in">x</span></button><input /><div id="plain"></div>'
    expect(isInteractiveTarget(document.getElementById('in'))).toBe(true)
    expect(isInteractiveTarget(document.querySelector('input'))).toBe(true)
    expect(isInteractiveTarget(document.getElementById('plain'))).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })
})
