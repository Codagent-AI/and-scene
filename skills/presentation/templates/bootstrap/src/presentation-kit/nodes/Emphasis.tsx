import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface EmphasisProps extends HTMLMotionProps<'div'> {
  id: string
  /** Marker kind hook, e.g. "flag" or "check". */
  kind?: string
}

/** Emphasis marker (flag, check, highlight) styled by the presentation. */
export function Emphasis({ id, kind, transition, ...rest }: EmphasisProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-node="emphasis"
      data-presentation-entity={id}
      data-presentation-kind={kind}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    />
  )
}
