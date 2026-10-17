import { describe, expect, it } from 'vitest'
import { SWIPE_THRESHOLD } from '../constants'
import { buildSections, clampIndex, isInteractiveTarget, keyAction, swipeAction } from '../navigation'

function key(init: KeyboardEventInit & { target?: Element }) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  if (init.target) Object.defineProperty(event, 'target', { value: init.target })
  return event
}

describe('keyAction', () => {
  it.each([
    ['ArrowRight', 'next'],
    [' ', 'next'],
    ['PageDown', 'next'],
    ['ArrowLeft', 'prev'],
    ['PageUp', 'prev'],
    ['p', 'toggle-mode'],
    ['P', 'toggle-mode'],
  ])('maps %j to %s', (name, action) => {
    expect(keyAction(key({ key: name }))).toBe(action)
  })

  it('ignores unrelated keys', () => {
    expect(keyAction(key({ key: 'a' }))).toBeNull()
    expect(keyAction(key({ key: 'Enter' }))).toBeNull()
  })

  it.each(['button', 'a', 'input', 'select', 'textarea', 'summary'])(
    'leaves keys to a focused <%s>',
    (tag) => {
      const control = document.createElement(tag)
      if (tag === 'a') control.setAttribute('href', '#x')
      document.body.append(control)
      for (const name of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
        expect(keyAction(key({ key: name, target: control }))).toBeNull()
      }
      control.remove()
    },
  )

  it('leaves keys to contenteditable and nested descendants', () => {
    const host = document.createElement('div')
    host.setAttribute('contenteditable', 'true')
    const inner = document.createElement('span')
    host.append(inner)
    document.body.append(host)
    expect(keyAction(key({ key: 'ArrowRight', target: inner }))).toBeNull()
    host.setAttribute('contenteditable', 'false')
    expect(keyAction(key({ key: 'ArrowRight', target: inner }))).toBe('next')
    host.remove()
  })

  it('ignores a button descendant and modifier chords, but not plain elements', () => {
    const button = document.createElement('button')
    const icon = document.createElement('span')
    button.append(icon)
    document.body.append(button)
    expect(isInteractiveTarget(icon)).toBe(true)
    expect(isInteractiveTarget(document.body)).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
    button.remove()
    for (const modifier of ['ctrlKey', 'altKey', 'metaKey']) {
      expect(keyAction(key({ key: 'ArrowRight', [modifier]: true }))).toBeNull()
    }
    expect(keyAction(key({ key: 'ArrowRight', target: document.body }))).toBe('next')
  })

  it('ignores events a handler already prevented', () => {
    const event = key({ key: 'ArrowRight' })
    event.preventDefault()
    expect(keyAction(event)).toBeNull()
  })
})

describe('swipeAction', () => {
  it('advances on a left swipe and goes back on a right swipe', () => {
    expect(swipeAction(-80, 0)).toBe('next')
    expect(swipeAction(80, 0)).toBe('prev')
  })

  it('applies the threshold exactly', () => {
    expect(swipeAction(-(SWIPE_THRESHOLD - 1), 0)).toBeNull()
    expect(swipeAction(-SWIPE_THRESHOLD, 0)).toBe('next')
    expect(swipeAction(SWIPE_THRESHOLD, 0)).toBe('prev')
  })

  it('requires horizontal dominance', () => {
    expect(swipeAction(-60, 90)).toBeNull()
    expect(swipeAction(-60, 60)).toBeNull()
    expect(swipeAction(-60, 59)).toBe('next')
    expect(swipeAction(0, 0)).toBeNull()
  })
})

describe('clampIndex', () => {
  it('stays inside [0, count - 1] without wrapping', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(5, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
    expect(clampIndex(3, 1)).toBe(0)
  })
})

describe('buildSections', () => {
  it('groups consecutive steps by era', () => {
    const eras = ['a', 'a', 'b', 'b', 'b', 'c'].map((era) => ({ era }))
    expect(buildSections(eras)).toEqual([
      { era: 'a', firstIndex: 0, lastIndex: 1 },
      { era: 'b', firstIndex: 2, lastIndex: 4 },
      { era: 'c', firstIndex: 5, lastIndex: 5 },
    ])
  })

  it('makes non-consecutive repeats separate sections', () => {
    const eras = ['a', 'b', 'a'].map((era) => ({ era }))
    expect(buildSections(eras).map((s) => [s.era, s.firstIndex])).toEqual([
      ['a', 0],
      ['b', 1],
      ['a', 2],
    ])
  })
})
