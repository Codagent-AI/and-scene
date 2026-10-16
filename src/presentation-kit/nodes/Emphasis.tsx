import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { entityProps } from './entity'

export interface EmphasisProps extends HTMLMotionProps<'div'> {
  id: string
  /** Marker kind hook, e.g. "flag" or "check". */
  kind?: string
}

/** Emphasis marker (flag, check, highlight) styled by the presentation. */
export function Emphasis({ id, kind, transition, ...rest }: EmphasisProps) {
  return <motion.div {...entityProps(id, 'emphasis', kind, transition)} {...rest} />
}
