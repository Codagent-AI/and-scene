import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface BoxProps extends HTMLMotionProps<'div'> {
  entityId: string
  children?: React.ReactNode
}

export function Box({ entityId, className, children, ...props }: BoxProps) {
  return <motion.div {...props} layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }} className={['presentation-box', className].filter(Boolean).join(' ')} data-presentation-node="box" data-presentation-id={entityId}>{children}</motion.div>
}
