import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface EmphasisProps extends HTMLMotionProps<'div'> { entityId: string; children?: React.ReactNode }
export function Emphasis({ entityId, className, children, ...props }: EmphasisProps) {
  return <motion.div {...props} layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }} className={['presentation-emphasis', className].filter(Boolean).join(' ')} data-presentation-node="emphasis" data-presentation-id={entityId}>{children}</motion.div>
}
