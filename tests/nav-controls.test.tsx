import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'

const navigationKeys = ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']
function sendKey(target: EventTarget, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  act(() => { target.dispatchEvent(event) })
  return event
}

describe('I-15 focused controls own navigation keys', () => {
  it.each([
    '<details><summary>Expand</summary><p>Contents</p></details>',
    '<div role="checkbox" tabindex="0" aria-checked="false">Check</div>',
    '<div role="tab" tabindex="0">Tab</div>',
    '<div role="switch" tabindex="0">Switch</div>',
    '<div role="combobox" tabindex="0">Choose</div>',
    '<div role="treeitem" tabindex="0">Tree item</div>',
    '<video controls></video>',
    '<audio controls></audio>',
    '<div tabindex="-1">Programmatically focusable custom control</div>',
  ])('does not consume native or custom control keys: %s', (markup) => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => result.current.jump(2))
    const host = document.createElement('div')
    host.innerHTML = markup
    document.body.append(host)
    const control = host.querySelector<HTMLElement>('summary,video,audio,[tabindex]')!
    control.focus()
    // jsdom does not implement media control focus; events still target those controls.
    if (!['VIDEO', 'AUDIO'].includes(control.tagName)) expect(document.activeElement).toBe(control)
    for (const key of navigationKeys) expect(sendKey(control, key).defaultPrevented).toBe(false)
    expect(result.current.index).toBe(2)
    expect(result.current.mode).toBe('browse')
    host.remove()
  })

  it('allows a custom checkbox Space handler to act once without advancing', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    const control = document.createElement('div')
    control.setAttribute('role', 'checkbox')
    control.tabIndex = 0
    control.setAttribute('aria-checked', 'false')
    const nested = control.appendChild(document.createElement('span'))
    let activations = 0
    control.addEventListener('keydown', event => {
      if (event.key === ' ') {
        activations++
        control.setAttribute('aria-checked', 'true')
      }
    })
    document.body.append(control)
    control.focus()
    expect(sendKey(nested, ' ').defaultPrevented).toBe(false)
    expect(control.getAttribute('aria-checked')).toBe('true')
    expect(activations).toBe(1)
    expect(result.current.index).toBe(0)
    control.remove()
  })

  it('protects the actual focused control even when a key is dispatched on window', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    const input = document.body.appendChild(document.createElement('input'))
    input.focus()
    expect(sendKey(window, ' ').defaultPrevented).toBe(false)
    expect(result.current.index).toBe(0)
    input.remove()
  })

  it('respects nearest contenteditable false while retaining keys in editable descendants', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    const editor = document.createElement('div')
    editor.contentEditable = 'true'
    editor.setAttribute('contenteditable', 'true')
    const editableChild = editor.appendChild(document.createElement('span'))
    const readOnly = editor.appendChild(document.createElement('div'))
    readOnly.setAttribute('contenteditable', 'false')
    const readOnlyChild = readOnly.appendChild(document.createElement('span'))
    document.body.append(editor)
    expect(sendKey(editableChild, 'ArrowRight').defaultPrevented).toBe(false)
    expect(result.current.index).toBe(0)
    expect(sendKey(readOnlyChild, 'ArrowRight').defaultPrevented).toBe(true)
    expect(result.current.index).toBe(1)
    editor.remove()
  })

  it('keeps presentation keys available when focus is on the document body', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    ;(document.activeElement as HTMLElement)?.blur()
    expect(sendKey(document.body, 'ArrowRight').defaultPrevented).toBe(true)
    expect(result.current.index).toBe(1)
    expect(sendKey(document.body, 'p').defaultPrevented).toBe(true)
    expect(result.current.mode).toBe('present')
  })
})
