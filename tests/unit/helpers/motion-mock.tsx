// Structural stand-in for `motion/react`: renders plain elements that expose the motion props
// (layoutId, initial, animate, exit) as data attributes so tests can assert wiring.
import { createElement, forwardRef, type ReactNode } from 'react'

const MOTION_PROPS = new Set([
  'layoutId', 'layout', 'initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'variants',
])

const json = (v: unknown) => (v === undefined ? undefined : JSON.stringify(v))

function component(tag: string) {
  return forwardRef<Element, Record<string, unknown>>(function MockMotion(props, ref) {
    const dom: Record<string, unknown> = { ref }
    for (const [k, v] of Object.entries(props)) if (!MOTION_PROPS.has(k)) dom[k] = v
    dom['data-mock-layout-id'] = props.layoutId
    dom['data-mock-initial'] = json(props.initial)
    dom['data-mock-animate'] = json(props.animate)
    dom['data-mock-exit'] = json(props.exit)
    dom['data-mock-transition'] = json(props.transition)
    return createElement(tag, dom)
  })
}

const cache = new Map<string, ReturnType<typeof component>>()

export const motionMock = {
  motion: new Proxy({} as Record<string, ReturnType<typeof component>>, {
    get: (_, tag: string) => {
      if (!cache.has(tag)) cache.set(tag, component(tag))
      return cache.get(tag)
    },
  }),
  AnimatePresence: ({ children }: { children?: ReactNode }) =>
    createElement('div', { 'data-mock-presence': '' }, children),
  LayoutGroup: ({ children }: { children?: ReactNode }) =>
    createElement('div', { 'data-mock-layout-group': '' }, children),
}

export const parse = (el: Element | null, attr: string) => {
  const raw = el?.getAttribute(attr)
  return raw ? JSON.parse(raw) : undefined
}
