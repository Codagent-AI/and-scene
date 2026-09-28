import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface EntityProps extends Omit<HTMLMotionProps<'div'>, 'layoutId' | 'id'> {
  /** Stable entity identity, used as the `layoutId` so it morphs across steps. */
  id: string
  children?: ReactNode
}

/** Shared base of the primitives: a layout-projected element with style hooks. */
export function Entity({
  id,
  kind,
  className,
  children,
  ...rest
}: EntityProps & { kind: string }) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={[`presentation-${kind}`, className].filter(Boolean).join(' ')}
      data-presentation-entity={id}
      data-presentation-kind={kind}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
