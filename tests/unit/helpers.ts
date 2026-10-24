import { act } from '@testing-library/react'
import { createElement, type ComponentType } from 'react'
import type { SceneProps, Step } from '../../src/presentation-kit'

export function setViewport(width: number, height = 800) {
  Object.assign(window, { innerWidth: width, innerHeight: height })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

export const NullScene: ComponentType<SceneProps<{ label: string }>> = ({ payload }) =>
  createElement('div', { 'data-testid': 'scene' }, payload.label)

export function makeSteps(eras: string[], Scene: ComponentType<SceneProps<{ label: string }>> = NullScene): Step<{ label: string }>[] {
  return eras.map((era, i) => ({
    id: `s${i}`,
    era,
    title: `Title ${i}`,
    caption: `Caption ${i} — a longer paragraph that explains the step in more than one line of text.`,
    Scene,
    payload: { label: `payload ${i}` },
  }))
}
