import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { actionForKey, clampIndex, swipeAction, usePresentationNav } from '../usePresentationNav.ts'

describe('actionForKey', () => {
  it.each([
    ['ArrowRight', 'next'],
    [' ', 'next'],
    ['PageDown', 'next'],
    ['ArrowLeft', 'prev'],
    ['PageUp', 'prev'],
    ['p', 'toggle'],
    ['P', 'toggle'],
  ])('maps %j to %s', (key, action) => {
    expect(actionForKey({ key })).toBe(action)
  })

  it('ignores unrelated keys and modified keys', () => {
    expect(actionForKey({ key: 'a' })).toBeNull()
    expect(actionForKey({ key: 'ArrowRight', ctrlKey: true })).toBeNull()
    expect(actionForKey({ key: 'p', metaKey: true })).toBeNull()
  })

  it('leaves keys to focused interactive controls', () => {
    for (const tag of ['button', 'input', 'select', 'textarea']) {
      const el = document.createElement(tag)
      expect(actionForKey({ key: ' ', target: el })).toBeNull()
      expect(actionForKey({ key: 'ArrowRight', target: el })).toBeNull()
    }
    const link = document.createElement('a')
    link.href = '/x'
    expect(actionForKey({ key: ' ', target: link })).toBeNull()
    const inner = document.createElement('span')
    const button = document.createElement('button')
    button.append(inner)
    expect(actionForKey({ key: ' ', target: inner })).toBeNull()
    expect(actionForKey({ key: ' ', target: document.createElement('div') })).toBe('next')
  })
})

describe('swipeAction', () => {
  it('swipes left to advance and right to go back', () => {
    expect(swipeAction(-80, 5)).toBe('next')
    expect(swipeAction(80, -5)).toBe('prev')
  })

  it('ignores short or mostly vertical movement', () => {
    expect(swipeAction(-20, 0)).toBeNull()
    expect(swipeAction(-60, 90)).toBeNull()
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

describe('usePresentationNav', () => {
  it('clamps at the first and last step', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
  })

  it('responds to keyboard and touch input, one step at a time', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.keyDown(window, { key: 'PageDown' })
    expect(result.current.index).toBe(3)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    fireEvent.keyDown(window, { key: 'PageUp' })
    expect(result.current.index).toBe(1)
    fireEvent.touchStart(window, { changedTouches: [{ clientX: 300, clientY: 100 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 100, clientY: 110 }] })
    expect(result.current.index).toBe(2)
    fireEvent.touchStart(window, { changedTouches: [{ clientX: 100, clientY: 100 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 300, clientY: 100 }] })
    expect(result.current.index).toBe(1)
  })

  it('does not advance when a focused control receives the key', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    const button = document.createElement('button')
    document.body.append(button)
    fireEvent.keyDown(button, { key: ' ' })
    expect(result.current.index).toBe(0)
    button.remove()
  })

  it('toggles mode with P while keeping the current step', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'present'))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(result.current.mode).toBe('present')
    fireEvent.keyDown(window, { key: 'p' })
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(1)
    fireEvent.keyDown(window, { key: 'P' })
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)
  })
})
