import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface FrameProps extends HTMLMotionProps<'div'> { entityId: string; children?: React.ReactNode }
export function Frame({ entityId, className, children, ...props }: FrameProps) {
  return <motion.div {...props} layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }} className={['presentation-frame', className].filter(Boolean).join(' ')} data-presentation-node="frame" data-presentation-id={entityId}>{children}</motion.div>
}
