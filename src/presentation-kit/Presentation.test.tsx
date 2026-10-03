// @vitest-environment jsdom
import { act, createElement, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

interface Payload { label: string }
let mountCount = 0
const PersistentScene = ({ payload }: SceneProps<Payload>) => {
  useEffect(() => { mountCount += 1 }, [])
  return createElement('div', { 'data-scene-label': payload.label }, payload.label)
}
const steps: Step<Payload>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', payload: { label: 'one' }, Scene: PersistentScene, groupKey: 'story' },
  { id: 'two', era: 'Next', title: 'Second', caption: 'Second caption', payload: { label: 'two' }, Scene: PersistentScene, groupKey: 'story' },
]

let root: Root | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  if (root) act(() => root?.unmount())
  host?.remove()
  root = undefined
  host = undefined
  mountCount = 0
})

function mount(props: { mode?: 'browse' | 'present'; attribution?: boolean } = {}) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root?.render(createElement(Presentation<Payload>, { steps, title: 'Test', initialMode: props.mode, attribution: props.attribution })))
  return host
}

describe('Presentation contract', () => {
  it('accepts strongly typed grouped payloads without casts and exposes step count/index', () => {
    const view = mount()
    expect(view.querySelector('[data-presentation-scene-group="story"] [data-scene-label="one"]')).not.toBeNull()
    expect(view.querySelector('[data-step-count="2"][data-step-index="0"]')).not.toBeNull()
  })

  it('provides active navigation semantics and default attribution without a default brand', () => {
    const view = mount()
    expect(view.querySelector('[data-presentation-progress][aria-current="step"][data-presentation-active="true"]')).not.toBeNull()
    expect(view.querySelector('[data-presentation-toc-entry][aria-current="location"]')).not.toBeNull()
    expect(view.querySelector('[data-presentation-attribution]')?.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(view.querySelector('.presentation-brand a')).toBeNull()
    expect(view.querySelector('[data-presentation-attribution]')?.getAttribute('style')).toBeNull()
  })

  it('supports browse and present modes and preserves the current step', () => {
    const view = mount()
    act(() => (view.querySelector('[data-presentation-mode-toggle]') as HTMLButtonElement).click())
    expect(view.querySelector('[data-presentation-mode="present"]')).not.toBeNull()
    act(() => (view.querySelector('[data-presentation-mode-toggle]') as HTMLButtonElement).click())
    expect(view.querySelector('[data-step-index="0"]')).not.toBeNull()
  })

  it('clamps navigation at both ends and jumps directly to a step', () => {
    const view = mount()
    act(() => (view.querySelector('[data-presentation-prev]') as HTMLButtonElement).click())
    expect(view.querySelector('[data-step-index="0"]')).not.toBeNull()
    act(() => (view.querySelectorAll('[data-presentation-progress]')[1] as HTMLButtonElement).click())
    expect(view.querySelector('[data-step-index="1"]')).not.toBeNull()
    act(() => (view.querySelector('[data-presentation-next]') as HTMLButtonElement).click())
    expect(view.querySelector('[data-step-index="1"]')).not.toBeNull()
  })

  it('keeps a grouped scene mounted as its typed payload changes', () => {
    const view = mount()
    expect(mountCount).toBe(1)
    act(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(view.querySelector('[data-scene-label="two"]')).not.toBeNull()
    expect(mountCount).toBe(1)
  })

  it('does not hijack navigation keys while an interactive control is focused', () => {
    const view = mount()
    const next = view.querySelector('[data-presentation-next]') as HTMLButtonElement
    next.focus()
    act(() => next.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(view.querySelector('[data-step-index="0"]')).not.toBeNull()
  })

  it('uses semantic style hooks without injecting visual defaults', () => {
    const view = mount({ attribution: false })
    expect(view.querySelector('[data-presentation-stage]')).not.toBeNull()
    expect(view.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(view.querySelector('[data-presentation-attribution]')).toBeNull()
    expect(view.querySelector('[data-presentation-progress]')?.getAttribute('style')).toBeNull()
  })
})
