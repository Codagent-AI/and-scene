import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'
export interface EmphasisProps extends HTMLMotionProps<'div'> { entityId: string; children?: React.ReactNode }
export function Emphasis({ entityId, children, className, ...props }: EmphasisProps) {
  return <motion.div {...props} layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.25, delay: LAYOUT_T } }} exit={{ opacity: 0, transition: { duration: 0.25 } }} className={['scene-emphasis', className].filter(Boolean).join(' ')} data-presentation-node="emphasis" data-entity-id={entityId}>{children}</motion.div>
}
