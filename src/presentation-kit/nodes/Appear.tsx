import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTRY, EXIT } from '../constants'
export function Appear(props: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={ENTRY}
      exit={EXIT}
      {...props}
    />
  )
}
