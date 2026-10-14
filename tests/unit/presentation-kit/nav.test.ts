import { describe, expect, it } from 'vitest'
import {
  clampIndex,
  isInteractiveTarget,
  navActionForKey,
  swipeAction,
} from '../../../src/presentation-kit/nav'

describe('clampIndex', () => {
  it('keeps indexes inside [0, last] without wrapping', () => {
    expect(clampIndex(-1, 3)).toBe(0)
    expect(clampIndex(3, 3)).toBe(2)
    expect(clampIndex(1, 3)).toBe(1)
  })

  it('treats an empty deck as index 0', () => {
    expect(clampIndex(4, 0)).toBe(0)
  })
})

describe('navActionForKey', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('maps %j to next', (key) => {
    expect(navActionForKey(key)).toBe('next')
  })

  it.each(['ArrowLeft', 'PageUp'])('maps %j to prev', (key) => {
    expect(navActionForKey(key)).toBe('prev')
  })

  it.each(['p', 'P'])('maps %j to mode toggle', (key) => {
    expect(navActionForKey(key)).toBe('toggle-mode')
  })

  it('ignores unrelated keys', () => {
    expect(navActionForKey('Enter')).toBeNull()
  })
})

describe('swipeAction', () => {
  it('advances on a leftward horizontal swipe and goes back on a rightward one', () => {
    expect(swipeAction(-120, 4)).toBe('next')
    expect(swipeAction(120, -4)).toBe('prev')
  })

  it('ignores short or mostly vertical gestures', () => {
    expect(swipeAction(-20, 0)).toBeNull()
    expect(swipeAction(-100, 150)).toBeNull()
  })
})

describe('isInteractiveTarget', () => {
  it('is true for focusable controls and false for plain stage content', () => {
    const button = document.createElement('button')
    const input = document.createElement('input')
    const link = document.createElement('a')
    link.href = 'https://example.com'
    const plain = document.createElement('div')
    document.body.append(button, input, link, plain)

    expect(isInteractiveTarget(button)).toBe(true)
    expect(isInteractiveTarget(input)).toBe(true)
    expect(isInteractiveTarget(link)).toBe(true)
    expect(isInteractiveTarget(plain)).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)

    button.remove()
    input.remove()
    link.remove()
    plain.remove()
  })
})
