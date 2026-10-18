import type { ReactNode } from 'react'
import { createElement } from 'react'

const MOTION_PROPS = ['initial', 'animate', 'exit', 'transition', 'layout', 'layoutId']

/** A stand-in for `motion/react` that renders plain elements, for tests that don't need animation. */
export const plainMotion = {
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        function Plain(props: Record<string, unknown>) {
          const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_PROPS.includes(k)))
          return createElement(tag, rest)
        },
    },
  ),
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  LayoutGroup: ({ children }: { children: ReactNode }) => children,
}
