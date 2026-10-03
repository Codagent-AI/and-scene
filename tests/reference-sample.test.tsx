import { isValidElement, type FunctionComponent } from 'react'
import { describe, expect, it } from 'vitest'
import type { SceneProps } from '../src/presentation-kit/types'
import { steps } from '../src/presentations/how-to-make-a-presentation/steps'

type Payload = { beat: number }

function collectText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(collectText).join(' ')
  if (isValidElement(value)) return collectText((value.props as { children?: unknown }).children)
  return ''
}

describe('reference sample scene identity', () => {
  it('shows the partial/full depth control docked to you on step five', () => {
    const step = steps[4]
    const Scene = step.Scene as FunctionComponent<SceneProps<Payload>>
    const scene = Scene({ payload: step.payload, step, index: 4 })
    expect(collectText(scene)).toContain('partial ↔ full')
  })

  it('gives every top-level scene child a unique stable React key across all steps', () => {
    for (const [index, step] of steps.entries()) {
      const Scene = step.Scene as FunctionComponent<SceneProps<Payload>>
      const scene = Scene({ payload: step.payload, step, index })
      expect(isValidElement(scene)).toBe(true)
      const children = (scene as React.ReactElement<{ children: unknown }>).props.children
      const elements = (Array.isArray(children) ? children : [children]).filter(isValidElement)
      const keys = elements.map((element) => element.key)
      expect(keys, `step ${index + 1}`).not.toContain(null)
      expect(new Set(keys).size, `step ${index + 1}`).toBe(keys.length)
    }
  })
})
