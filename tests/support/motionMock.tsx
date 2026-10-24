import { createElement, forwardRef, type ReactNode } from 'react'

/** Every render of a mocked motion element, so tests can assert the motion props actually applied. */
export const captured: { tag: string; props: Record<string, unknown> }[] = []
export const resetCaptured = () => {
  captured.length = 0
}

const MOTION_ONLY = new Set(['layout', 'layoutId', 'initial', 'animate', 'exit', 'transition'])
const components = new Map<string, unknown>()

function motionElement(tag: string) {
  if (!components.has(tag)) {
    components.set(
      tag,
      forwardRef<Element, Record<string, unknown>>(function MockMotion(props, ref) {
        captured.push({ tag, props })
        const dom: Record<string, unknown> = { ref }
        for (const [key, value] of Object.entries(props)) if (!MOTION_ONLY.has(key)) dom[key] = value
        if (props.layoutId) dom['data-layout-id'] = props.layoutId
        if (props.layout) dom['data-layout'] = 'true'
        return createElement(tag, dom)
      }),
    )
  }
  return components.get(tag) as never
}

export const motionMock = {
  motion: new Proxy({}, { get: (_target, tag: string) => motionElement(tag) }),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  LayoutGroup: ({ children }: { children?: ReactNode }) => (
    <div data-mock-layout-group="" style={{ display: 'contents' }}>
      {children}
    </div>
  ),
}
