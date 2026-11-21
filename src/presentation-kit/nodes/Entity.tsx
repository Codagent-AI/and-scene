import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'

export type EntityProps = Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'> & {
  id: string
  enter?: boolean
}

export function Entity({ id, enter = false, ...props }: EntityProps) {
  return <motion.div
    data-presentation-entity={id}
    layoutId={id}
    layout
    initial={enter ? { opacity: 0 } : false}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: ENTER_T, ease: EASE } }}
    transition={{
      layout: { duration: LAYOUT_T, ease: EASE },
      opacity: { delay: enter ? ENTER_DELAY : 0, duration: ENTER_T, ease: EASE },
    }}
    {...props}
  />
}
