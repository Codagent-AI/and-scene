import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Arrow({ entityId, className, ...props }: HTMLMotionProps<'div'> & { entityId: string }) { return <motion.div layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }} className={['scene-arrow', className].filter(Boolean).join(' ')} aria-hidden="true" data-presentation-arrow="" data-entity-id={entityId} {...props} /> }
