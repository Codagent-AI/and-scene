import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface ArrowProps extends HTMLMotionProps<'div'> { entityId: string; children?: React.ReactNode }
export function Arrow({ entityId, className, children, ...props }: ArrowProps) {
  return <motion.div {...props} layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }} className={['presentation-arrow', className].filter(Boolean).join(' ')} data-presentation-node="arrow" data-presentation-id={entityId} aria-hidden={props['aria-hidden'] ?? true}>{children}</motion.div>
}
