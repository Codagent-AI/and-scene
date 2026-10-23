/* eslint-disable react-refresh/only-export-components -- test double, not a component module */
// Stand-in for motion/react that renders motion props as data attributes, so
// unit tests can assert identity (layoutId) and animation props deterministically.
import { forwardRef, type ReactNode } from 'react'

type Props = Record<string, unknown> & { children?: ReactNode }

const serialize = (value: unknown) => (value === undefined ? undefined : JSON.stringify(value))

const MotionDiv = forwardRef<HTMLDivElement, Props>(function MotionDiv(
  { layoutId, initial, animate, exit, transition, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      data-layout-id={layoutId as string | undefined}
      data-motion-initial={serialize(initial)}
      data-motion-animate={serialize(animate)}
      data-motion-exit={serialize(exit)}
      data-motion-transition={serialize(transition)}
      {...(rest as Record<string, string | undefined>)}
    >
      {children}
    </div>
  )
})

export const motion = { div: MotionDiv }

export function AnimatePresence({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function LayoutGroup({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
