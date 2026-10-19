// Replaces `motion/react` with plain elements that expose the animation props as
// data attributes, so tests can assert layout identity, entrance and exit settings.
import { createElement, forwardRef } from 'react'
import type { ReactNode } from 'react'

const json = (v: unknown) => (v === undefined ? undefined : JSON.stringify(v))

const make = (tag: string) =>
  forwardRef<HTMLElement, Record<string, unknown>>(function MockMotion(props, ref) {
    const { initial, animate, exit, transition, layout, layoutId, ...rest } = props
    return createElement(tag, {
      ...rest,
      ref,
      'data-m-layout': layout ? 'true' : undefined,
      'data-m-layout-id': layoutId as string | undefined,
      'data-m-initial': json(initial),
      'data-m-animate': json(animate),
      'data-m-exit': json(exit),
      'data-m-transition': json(transition),
    })
  })

const cache = new Map<string, ReturnType<typeof make>>()
export const motion = new Proxy({}, { get: (_t, tag: string) => cache.get(tag) ?? (cache.set(tag, make(tag)), cache.get(tag)!) })
export const AnimatePresence = ({ children }: { children?: ReactNode }) => <>{children}</>
export const LayoutGroup = ({ children }: { children?: ReactNode }) => <>{children}</>
