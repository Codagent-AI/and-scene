import { createElement, Fragment, type ReactNode } from 'react'

const MOTION_PROPS = ['initial', 'animate', 'exit', 'transition', 'layout', 'layoutId', 'layoutRoot'] as const

type AnyProps = Record<string, unknown>

function motionElement(tag: string) {
  return function MotionElement(props: AnyProps) {
    const dom: AnyProps = { ...props }
    const motion: AnyProps = {}
    for (const key of MOTION_PROPS) {
      if (key in dom) {
        motion[key] = dom[key]
        delete dom[key]
      }
    }
    return createElement(tag, {
      ...dom,
      'data-layout-id': motion.layoutId as string | undefined,
      'data-motion': JSON.stringify(motion),
    })
  }
}

/** Replaces `motion/react` so tests can read the motion props a component passes. */
export const motionModule = {
  motion: new Proxy({} as Record<string, ReturnType<typeof motionElement>>, {
    get: (cache, tag: string) => (cache[tag] ??= motionElement(tag)),
  }),
  AnimatePresence: ({ children, ...rest }: { children?: ReactNode } & AnyProps) =>
    createElement('div', { 'data-mock-presence': JSON.stringify(rest) }, children),
  LayoutGroup: ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, createElement('div', { 'data-mock-layout-group': '' }, children)),
}

export function motionOf(el: Element): Record<string, unknown> {
  return JSON.parse(el.getAttribute('data-motion') ?? '{}')
}
