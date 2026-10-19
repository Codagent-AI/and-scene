import { createElement, forwardRef, useEffect, type ComponentType, type ReactNode } from 'react'
import { vi } from 'vitest'

type Props = Record<string, unknown>

export interface MotionCall {
  tag: string
  props: Props
}

/** Every render of a `motion.*` element since the last reset. */
export const motionCalls: MotionCall[] = []
/** Elements currently mounted, keyed by entity id (or layoutId). */
export const liveMounts = new Map<string, number>()
/** Total mounts ever, keyed likewise. Counts StrictMode's extra mount too. */
export const totalMounts = new Map<string, number>()

export function resetMotionSpy(): void {
  motionCalls.length = 0
  liveMounts.clear()
  totalMounts.clear()
}

export function callsFor(entityId: string): MotionCall[] {
  return motionCalls.filter(
    (c) => c.props['data-presentation-entity'] === entityId || c.props.layoutId === entityId,
  )
}

function bump(map: Map<string, number>, key: string, by: number) {
  map.set(key, (map.get(key) ?? 0) + by)
}

/**
 * Factory for `vi.mock('motion/react', ...)`. Real motion still runs; this only records the props
 * each `motion.*` element receives, counts mounts, and marks the LayoutGroup and AnimatePresence
 * ancestry with `data-test-*` wrapper divs.
 */
export async function createMotionMock() {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react')
  const cache = new Map<string, ComponentType<Props>>()
  const motion = new Proxy(actual.motion, {
    get(target, tag, receiver) {
      const real = Reflect.get(target, tag, receiver) as unknown
      if (typeof tag !== 'string' || tag === 'create' || typeof real !== 'object') return real
      let wrapped = cache.get(tag)
      if (!wrapped) {
        const Real = real as ComponentType<Props>
        wrapped = forwardRef<unknown, Props>(function Spy(props, ref) {
          motionCalls.push({ tag, props })
          const key = (props['data-presentation-entity'] ?? props.layoutId) as string | undefined
          useEffect(() => {
            if (!key) return
            bump(liveMounts, key, 1)
            bump(totalMounts, key, 1)
            return () => bump(liveMounts, key, -1)
          }, [key])
          return createElement(Real, { ...props, ref })
        }) as unknown as ComponentType<Props>
        cache.set(tag, wrapped)
      }
      return wrapped
    },
  })
  const wrapIn = (marker: string, Inner: ComponentType<{ children?: ReactNode }>) =>
    function Marked(props: { children?: ReactNode }) {
      return createElement('div', { [marker]: '' }, createElement(Inner, props))
    }
  return {
    ...actual,
    motion,
    AnimatePresence: wrapIn('data-test-presence', actual.AnimatePresence as ComponentType<{ children?: ReactNode }>),
    LayoutGroup: wrapIn('data-test-layoutgroup', actual.LayoutGroup as ComponentType<{ children?: ReactNode }>),
  }
}
