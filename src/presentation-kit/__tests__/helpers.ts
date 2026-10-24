import { createElement } from 'react'
import type { SceneProps, Step } from '../types'

function TextScene({ stepId }: SceneProps<undefined>) {
  return createElement('div', { 'data-testid': 'scene' }, stepId)
}

export function makeSteps(n: number, eras: string[] = []): Step[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i + 1}`,
    era: eras[i] ?? `era ${i < 2 ? 'a' : 'b'}`,
    title: `Title ${i + 1}`,
    caption: `Caption ${i + 1}`,
    payload: undefined,
    Scene: TextScene,
  }))
}
