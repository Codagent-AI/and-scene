import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode
  /** Stable entity identity; also the `layoutId` that makes the box morph across steps. */
  id: string
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
  /** Semantic role hook, e.g. "card" or "node"; exposed as `data-presentation-kind`. */
  kind?: string
}

/** Generic box primitive: identity and style hooks only, no visual defaults. */
export function Box({ id, Icon, kind, children, transition, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-node="box"
      data-presentation-entity={id}
      data-presentation-kind={kind}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    >
      {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}
      {children}
    </motion.div>
  )
}
