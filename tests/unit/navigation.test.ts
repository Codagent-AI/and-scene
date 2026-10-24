import { describe, expect, it } from 'vitest'
import { clampIndex, isInteractiveTarget, keyAction, swipeAction } from '../../src/presentation-kit'

const key = (k: string, mods: Partial<KeyboardEvent> = {}) => keyAction({ key: k, altKey: false, ctrlKey: false, metaKey: false, ...mods })

describe('keyAction', () => {
  it('maps Right, Space and PageDown to next', () => {
    expect(['ArrowRight', ' ', 'PageDown'].map((k) => key(k))).toEqual(['next', 'next', 'next'])
  })
  it('maps Left and PageUp to prev', () => {
    expect(['ArrowLeft', 'PageUp'].map((k) => key(k))).toEqual(['prev', 'prev'])
  })
  it('maps P to mode toggle and ignores other keys and modified keys', () => {
    expect(key('p')).toBe('toggle-mode')
    expect(key('x')).toBeNull()
    expect(key('ArrowRight', { metaKey: true })).toBeNull()
  })
})

describe('swipeAction', () => {
  it('swiping left advances and swiping right goes back', () => {
    expect(swipeAction(-120, 5)).toBe('next')
    expect(swipeAction(120, -5)).toBe('prev')
  })
  it('ignores short or mostly vertical gestures', () => {
    expect(swipeAction(-20, 0)).toBeNull()
    expect(swipeAction(-80, 200)).toBeNull()
  })
})

describe('clampIndex', () => {
  it('clamps at both ends without wrapping', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(5, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
    expect(clampIndex(3, 0)).toBe(0)
  })
})

describe('isInteractiveTarget', () => {
  it('treats controls and their descendants as interactive', () => {
    document.body.innerHTML = '<button><span id="in">x</span></button><div id="plain"></div><a href="/x" id="a">l</a>'
    expect(isInteractiveTarget(document.getElementById('in'))).toBe(true)
    expect(isInteractiveTarget(document.getElementById('a'))).toBe(true)
    expect(isInteractiveTarget(document.getElementById('plain'))).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })
})
