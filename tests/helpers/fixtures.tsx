import type { ComponentType } from 'react'
import type { SceneProps, Step } from '../../src/presentation-kit'

export interface TextPayload {
  text: string
}

export function TextScene({ payload }: SceneProps<TextPayload>) {
  return <div data-testid="scene-text">{payload.text}</div>
}

export function makeSteps(
  specs: { id: string; era: string; groupKey?: string; Scene?: ComponentType<SceneProps<TextPayload>> }[],
): Step<TextPayload>[] {
  return specs.map((s, i) => ({
    id: s.id,
    era: s.era,
    title: `Title ${s.id}`,
    caption: `Caption ${s.id}`,
    Scene: s.Scene ?? TextScene,
    payload: { text: `payload ${i}` },
    groupKey: s.groupKey,
  }))
}

export const FOUR = makeSteps([
  { id: 'a', era: 'one' },
  { id: 'b', era: 'one' },
  { id: 'c', era: 'two' },
  { id: 'd', era: 'three' },
])

export function setViewport(width: number, height = 900) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}
