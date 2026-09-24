import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'id'> { entityId: string; as?: 'div' | 'article' }
export function Box({ entityId, className, ...props }: BoxProps) { return <motion.div layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }} className={['scene-box', className].filter(Boolean).join(' ')} data-presentation-box="" data-entity-id={entityId} {...props} /> }
