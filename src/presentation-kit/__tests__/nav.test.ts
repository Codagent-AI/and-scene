import { describe, expect, it } from 'vitest'
import { clampIndex, isInteractiveTarget, keyAction, swipeAction } from '../nav'

describe('keyAction', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances', (key) => expect(keyAction(key)).toBe('next'))
  it.each(['ArrowLeft', 'PageUp'])('%s goes back', (key) => expect(keyAction(key)).toBe('prev'))
  it('toggles mode on P and ignores other keys', () => {
    expect(keyAction('p')).toBe('toggle-mode')
    expect(keyAction('a')).toBeNull()
  })
})

describe('swipeAction', () => {
  it('left swipe advances, right swipe goes back', () => {
    expect(swipeAction(-120, 5)).toBe('next')
    expect(swipeAction(120, -5)).toBe('prev')
  })
  it('ignores short or mostly vertical swipes', () => {
    expect(swipeAction(-20, 0)).toBeNull()
    expect(swipeAction(-80, 120)).toBeNull()
  })
})

describe('clampIndex', () => {
  it('clamps at both ends with no wrap-around', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(5, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
  })
})

describe('isInteractiveTarget', () => {
  it('recognises controls and their descendants', () => {
    document.body.innerHTML = '<button><span id="in"></span></button><a href="/x" id="a"></a><div id="d"></div>'
    expect(isInteractiveTarget(document.getElementById('in'))).toBe(true)
    expect(isInteractiveTarget(document.getElementById('a'))).toBe(true)
    expect(isInteractiveTarget(document.getElementById('d'))).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })

  it.each(['slider', 'spinbutton', 'combobox', 'textbox', 'listbox', 'checkbox', 'radio', 'switch', 'tab', 'menuitem'])(
    'recognises ARIA %s widgets',
    (role) => {
      document.body.innerHTML = `<div role="${role}" id="w"></div>`
      expect(isInteractiveTarget(document.getElementById('w'))).toBe(true)
    },
  )
})
