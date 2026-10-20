import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation.tsx'
import { key, makeSteps, touch } from './testing.tsx'

const index = () => Number(document.querySelector('[data-step-index]')!.getAttribute('data-step-index'))
const mode = () => document.querySelector('[data-presentation-mode]')!.getAttribute('data-presentation-mode')

function mount(count = 5, initialMode: 'present' | 'browse' = 'browse') {
  return render(
    <Presentation
      steps={makeSteps(Array.from({ length: count }, (_, i) => `era ${Math.floor(i / 2)}`))}
      initialMode={initialMode}
    />,
  )
}

describe('keyboard navigation', () => {
  it('advances on Right, Space and PageDown, one step each', () => {
    mount()
    key('ArrowRight')
    expect(index()).toBe(1)
    key(' ')
    expect(index()).toBe(2)
    key('PageDown')
    expect(index()).toBe(3)
  })

  it('goes back on Left and PageUp, one step each', () => {
    mount()
    for (let i = 0; i < 4; i++) key('ArrowRight')
    key('ArrowLeft')
    expect(index()).toBe(3)
    key('PageUp')
    expect(index()).toBe(2)
  })

  it('ignores unrelated keys and prevents the default of handled keys', () => {
    mount()
    key('x')
    key('ArrowUp')
    expect(index()).toBe(0)
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    act(() => void window.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(true)
    expect(index()).toBe(1)
  })

  it('never navigates on Ctrl, Meta or Alt combinations', () => {
    mount()
    for (const mod of ['ctrlKey', 'metaKey', 'altKey']) {
      key('ArrowRight', { [mod]: true })
      key('p', { [mod]: true })
    }
    expect(index()).toBe(0)
    expect(mode()).toBe('browse')
  })
})

describe('controls keep their keys', () => {
  const targets: Array<[string, () => HTMLElement]> = [
    ['button', () => Object.assign(document.createElement('button'), { textContent: 'b' })],
    ['link', () => Object.assign(document.createElement('a'), { href: '#x', textContent: 'a' })],
    ['input', () => document.createElement('input')],
    ['select', () => document.createElement('select')],
    ['textarea', () => document.createElement('textarea')],
    ['summary', () => document.createElement('summary')],
    ['contenteditable', () => Object.assign(document.createElement('div'), { contentEditable: 'true' })],
    ['aria role', () => Object.assign(document.createElement('div'), { role: 'slider' })],
    ['plaintext-only editable', () => { const d = document.createElement('div'); d.setAttribute('contenteditable', 'plaintext-only'); return d }],
    ['empty contenteditable attribute', () => { const d = document.createElement('div'); d.setAttribute('contenteditable', ''); return d }],
    ['menuitemcheckbox', () => { const d = document.createElement('div'); d.setAttribute('role', 'menuitemcheckbox'); return d }],
    ['menuitemradio', () => { const d = document.createElement('div'); d.setAttribute('role', 'menuitemradio'); return d }],
    ['treegrid', () => { const d = document.createElement('div'); d.setAttribute('role', 'treegrid'); return d }],
  ]
  for (const [name, make] of targets) {
    it(`leaves ${name} alone, including nested children`, () => {
      mount()
      const control = make()
      if (name === 'contenteditable') control.setAttribute('contenteditable', 'true')
      const child = document.createElement('span')
      control.append(child)
      document.body.append(control)
      for (const target of [control, child]) {
        for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p', 'P']) {
          const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
          act(() => void target.dispatchEvent(event))
          expect(event.defaultPrevented).toBe(false)
        }
      }
      expect(index()).toBe(0)
      expect(mode()).toBe('browse')
      control.remove()
    })
  }

  it('does not treat contenteditable=false as a control', () => {
    mount()
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'false')
    document.body.append(div)
    key('ArrowRight', {}, div)
    expect(index()).toBe(1)
    div.remove()
  })

  it('still navigates from the body', () => {
    mount()
    key('ArrowRight', {}, document.body)
    expect(index()).toBe(1)
  })
})

describe('touch swipe', () => {
  it('advances on a left swipe and goes back on a right swipe', () => {
    mount()
    touch(300, 100, 200, 100)
    expect(index()).toBe(1)
    touch(200, 100, 300, 100)
    expect(index()).toBe(0)
  })

  it('ignores taps, short swipes, vertical gestures and diagonal ties', () => {
    mount()
    touch(300, 100, 300, 100)
    touch(300, 100, 260, 100)
    touch(300, 100, 300, 300)
    touch(300, 100, 200, 200)
    expect(index()).toBe(0)
  })

  it('accepts exactly the minimum travel when horizontal dominates', () => {
    mount()
    touch(300, 100, 250, 140)
    expect(index()).toBe(1)
  })
})

describe('boundaries', () => {
  it('clamps at the start and at the end through every input', () => {
    mount(3)
    key('ArrowLeft')
    touch(100, 0, 300, 0)
    expect(index()).toBe(0)
    expect((screen.getByText('Previous') as HTMLButtonElement).disabled).toBe(true)
    for (let i = 0; i < 6; i++) key('ArrowRight')
    touch(300, 0, 100, 0)
    expect(index()).toBe(2)
    expect((screen.getByText('Next') as HTMLButtonElement).disabled).toBe(true)
  })

  it('clamps direct jumps', () => {
    mount(3)
    act(() => screen.getAllByRole('button', { name: /Step 3/ })[0].click())
    expect(index()).toBe(2)
  })

  it('stays on a valid step when the step list shrinks', () => {
    const view = mount(4)
    for (let i = 0; i < 3; i++) key('ArrowRight')
    view.rerender(<Presentation steps={makeSteps(['a', 'b'])} initialMode="browse" />)
    expect(index()).toBe(1)
    key('ArrowLeft')
    expect(index()).toBe(0)
    key('ArrowRight')
    expect(index()).toBe(1)
    key('ArrowRight')
    expect(index()).toBe(1)
  })
})

describe('mode', () => {
  it('toggles with p or P and with the control, preserving the step', () => {
    mount(5, 'present')
    key('ArrowRight')
    key('ArrowRight')
    expect(mode()).toBe('present')
    key('p')
    expect(mode()).toBe('browse')
    key('P')
    expect(mode()).toBe('present')
    act(() => screen.getByRole('button', { name: 'Browse' }).click())
    expect(mode()).toBe('browse')
    expect(index()).toBe(2)
  })

  it('honors initialMode', () => {
    mount(2, 'present')
    expect(mode()).toBe('present')
  })
})
