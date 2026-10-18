import { describe, expect, it } from 'vitest'
import { clampIndex, isInteractiveTarget, keyAction, swipeAction } from './nav'

describe('nav helpers', () => {
  it('clamps an index to the step range', () => {
    expect(clampIndex(-3, 5)).toBe(0)
    expect(clampIndex(2, 5)).toBe(2)
    expect(clampIndex(9, 5)).toBe(4)
    expect(clampIndex(1, 0)).toBe(0)
  })

  it('maps keys to actions', () => {
    for (const k of ['ArrowRight', ' ', 'PageDown']) expect(keyAction(k)).toBe('next')
    for (const k of ['ArrowLeft', 'PageUp']) expect(keyAction(k)).toBe('prev')
    expect(keyAction('p')).toBe('toggle-mode')
    expect(keyAction('x')).toBeNull()
  })

  it('recognizes interactive targets and their descendants', () => {
    document.body.innerHTML = `
      <button id="b"><span id="in-b"></span></button><a id="l" href="#x">l</a>
      <a id="nolink">n</a><input id="i"><select id="s"></select><textarea id="t"></textarea>
      <details><summary id="sum">s</summary></details>
      <div id="ce" contenteditable="true"><b id="in-ce"></b></div>
      <div id="ce-off" contenteditable="false"></div><div id="plain"></div>`
    const el = (id: string) => document.getElementById(id)
    for (const id of ['b', 'in-b', 'l', 'i', 's', 't', 'sum', 'ce', 'in-ce'])
      expect(isInteractiveTarget(el(id)), id).toBe(true)
    for (const id of ['nolink', 'ce-off', 'plain']) expect(isInteractiveTarget(el(id)), id).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })

  it('swipes need a horizontal-dominant move of at least 50px', () => {
    expect(swipeAction(-50, 0)).toBe('next')
    expect(swipeAction(-120, 10)).toBe('next')
    expect(swipeAction(50, 0)).toBe('prev')
    expect(swipeAction(49, 0)).toBeNull()
    expect(swipeAction(-80, 90)).toBeNull()
    expect(swipeAction(-80, 80)).toBeNull()
    expect(swipeAction(0, 200)).toBeNull()
  })
})
