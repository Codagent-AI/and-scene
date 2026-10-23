import { createElement, forwardRef, type ReactNode } from 'react'

/**
 * Stand-in for `motion/react` that renders plain elements and exposes the
 * animation props the kit passes, so tests can assert layout/enter/exit wiring.
 */
const json = (v: unknown) => (v === undefined ? undefined : JSON.stringify(v))

function make(tag: string) {
  return forwardRef<HTMLElement, Record<string, unknown> & { children?: ReactNode }>(
    function MockMotion({ children, layoutId, initial, animate, exit, transition, ...rest }, ref) {
      const safe: Record<string, unknown> = { ...rest }
      // motion-only style keys have no DOM meaning
      const style = { ...((rest.style as Record<string, unknown>) ?? {}) }
      delete style.originX
      delete style.originY
      safe.style = style
      return createElement(
        tag,
        {
          ...safe,
          ref,
          'data-layout-id': layoutId as string | undefined,
          'data-m-initial': json(initial),
          'data-m-animate': json(animate),
          'data-m-exit': json(exit),
          'data-m-transition': json(transition),
        },
        children as ReactNode,
      )
    },
  )
}

const cache = new Map<string, ReturnType<typeof make>>()

export const motionMock = {
  motion: new Proxy(
    {},
    {
      get(_t, tag: string) {
        if (!cache.has(tag)) cache.set(tag, make(tag))
        return cache.get(tag)
      },
    },
  ),
  AnimatePresence: ({ children, initial }: { children?: ReactNode; initial?: boolean }) =>
    createElement('div', { 'data-mock-presence': '', 'data-presence-initial': String(initial) }, children),
  LayoutGroup: ({ children }: { children?: ReactNode }) =>
    createElement('div', { 'data-mock-layout-group': '' }, children),
}
