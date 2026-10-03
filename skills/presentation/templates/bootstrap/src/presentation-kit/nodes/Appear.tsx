import { motion } from 'motion/react'
import type { NodeProps } from '../types'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear({ id, className, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} className={className} data-presentation-appear="" data-entity-id={id}
    initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: ENTER_DELAY } }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }} {...props}>{children}</motion.div>
}
