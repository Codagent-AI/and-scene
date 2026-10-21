import { createElement } from 'react'
import type { ReactNode } from 'react'

/**
 * A stand-in for `motion/react` that renders plain elements and records the
 * Motion props as JSON in `data-motion`, so tests can assert the wiring (layoutId,
 * layout, transition, initial/animate/exit) deterministically.
 */
const RECORDED = ['layout', 'layoutId', 'transition', 'initial', 'animate', 'exit'] as const

function stub(tag: string) {
  return function MotionStub(props: Record<string, unknown>) {
    const recorded: Record<string, unknown> = {}
    const rest: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(props)) {
      if ((RECORDED as readonly string[]).includes(key)) recorded[key] = value
      else rest[key] = value
    }
    return createElement(tag, { ...rest, 'data-motion': JSON.stringify(recorded) })
  }
}

export const motion = new Proxy({} as Record<string, ReturnType<typeof stub>>, {
  get: (_, tag: string) => stub(tag),
})
export const AnimatePresence = ({ children }: { children?: ReactNode }) => children
export const LayoutGroup = ({ children }: { children?: ReactNode }) => children

export function motionOf(element: Element | null): Record<string, unknown> {
  return JSON.parse(element?.getAttribute('data-motion') ?? '{}')
}
