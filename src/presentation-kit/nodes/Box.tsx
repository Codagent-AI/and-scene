import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
export function Box({ id, ...props }: { id: string } & Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'>) {
  return <motion.div {...props} layoutId={id} data-presentation-node="box" data-presentation-id={id} />
}
