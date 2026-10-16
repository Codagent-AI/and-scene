import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants'

export interface EmphasisProps extends Omit<HTMLMotionProps<'span'>, 'layoutId' | 'id' | 'children'> {
  children?: ReactNode
  id?: string
  /** Whether the emphasis is currently on; exposed as a data hook for author CSS. */
  active?: boolean
}

/** Marks content as emphasized without choosing how emphasis looks. */
export function Emphasis({ id, active = true, children, ...rest }: EmphasisProps) {
  return (
    <motion.span
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-entity={id}
      data-presentation-node="emphasis"
      data-presentation-emphasis={active ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </motion.span>
  )
}
