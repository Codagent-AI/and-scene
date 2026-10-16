// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { actionForKey, actionForSwipe, clampIndex } from './nav.ts'

const key = (k: string, extra: Partial<Parameters<typeof actionForKey>[0]> = {}) =>
  actionForKey({ key: k, ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, target: null, ...extra })

describe('clampIndex', () => {
  it('stays within [0, last] with no wrap-around', () => {
    expect(clampIndex(-1, 9)).toBe(0)
    expect(clampIndex(0, 9)).toBe(0)
    expect(clampIndex(8, 9)).toBe(8)
    expect(clampIndex(9, 9)).toBe(8)
    expect(clampIndex(3, 0)).toBe(0)
  })
})

describe('actionForKey', () => {
  it('maps next, previous, and mode keys', () => {
    for (const k of ['ArrowRight', ' ', 'PageDown']) expect(key(k)).toBe('next')
    for (const k of ['ArrowLeft', 'PageUp']) expect(key(k)).toBe('prev')
    expect(key('p')).toBe('toggle-mode')
    expect(key('P')).toBe('toggle-mode')
    expect(key('x')).toBeNull()
  })

  it('ignores modified keys and handled events', () => {
    expect(key('ArrowRight', { ctrlKey: true })).toBeNull()
    expect(key('ArrowRight', { metaKey: true })).toBeNull()
    expect(key('ArrowRight', { altKey: true })).toBeNull()
    expect(key('ArrowRight', { defaultPrevented: true })).toBeNull()
  })

  it('leaves keys to focused interactive controls', () => {
    const button = document.createElement('button')
    const input = document.createElement('input')
    const div = document.createElement('div')
    document.body.append(button, input, div)
    expect(key(' ', { target: button })).toBeNull()
    expect(key('ArrowRight', { target: input })).toBeNull()
    expect(key('ArrowRight', { target: div })).toBe('next')
    for (const value of ['', 'true', 'plaintext-only']) {
      const editor = document.createElement('div')
      editor.setAttribute('contenteditable', value)
      document.body.append(editor)
      expect(key('ArrowRight', { target: editor }), `contenteditable="${value}"`).toBeNull()
    }
  })
})

describe('actionForSwipe', () => {
  it('swipe left advances and swipe right goes back', () => {
    expect(actionForSwipe(-120, 5)).toBe('next')
    expect(actionForSwipe(120, -5)).toBe('prev')
  })

  it('ignores short and mostly vertical swipes', () => {
    expect(actionForSwipe(-10, 0)).toBeNull()
    expect(actionForSwipe(-80, 120)).toBeNull()
  })
})
