import { describe, expect, it } from 'vitest'
import { actionForKey, actionForSwipe } from './navKeys.ts'

const key = (k: string, init: KeyboardEventInit = {}) => new KeyboardEvent('keydown', { key: k, bubbles: true, ...init })

describe('keyboard actions', () => {
  it.each([
    ['ArrowRight', 'next'],
    [' ', 'next'],
    ['PageDown', 'next'],
    ['ArrowLeft', 'prev'],
    ['PageUp', 'prev'],
    ['p', 'toggle-mode'],
    ['P', 'toggle-mode'],
  ])('maps %j to %s', (k, action) => {
    expect(actionForKey(key(k))).toBe(action)
  })

  it('ignores unrelated keys and modifier combinations', () => {
    expect(actionForKey(key('a'))).toBeNull()
    expect(actionForKey(key('ArrowRight', { ctrlKey: true }))).toBeNull()
    expect(actionForKey(key('ArrowRight', { metaKey: true }))).toBeNull()
    expect(actionForKey(key('ArrowRight', { altKey: true }))).toBeNull()
  })

  it.each([
    ['button', () => document.createElement('button')],
    ['input', () => document.createElement('input')],
    ['textarea', () => document.createElement('textarea')],
    ['select', () => document.createElement('select')],
    ['link', () => Object.assign(document.createElement('a'), { href: '#x' })],
    ['contenteditable', () => { const d = document.createElement('div'); d.setAttribute('contenteditable', 'true'); return d }],
    ['aria role', () => { const d = document.createElement('div'); d.setAttribute('role', 'slider'); return d }],
  ])('leaves keys to a focused %s', (_name, make) => {
    const target = make()
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    document.body.append(target)
    Object.defineProperty(event, 'target', { value: target })
    expect(actionForKey(event)).toBeNull()
    target.remove()
  })
})

describe('swipe actions', () => {
  it('swipe left advances and swipe right goes back', () => {
    expect(actionForSwipe(-80, 5)).toBe('next')
    expect(actionForSwipe(80, -5)).toBe('prev')
  })

  it('ignores short and vertical-dominant gestures', () => {
    expect(actionForSwipe(-49, 0)).toBeNull()
    expect(actionForSwipe(-60, 90)).toBeNull()
    expect(actionForSwipe(0, 120)).toBeNull()
  })
})
