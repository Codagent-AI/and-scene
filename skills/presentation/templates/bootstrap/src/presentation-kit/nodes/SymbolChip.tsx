import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function SymbolChip({ entityId, className, ...props }: HTMLMotionProps<'div'> & { entityId: string }) { return <motion.div layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }} className={['scene-symbol-chip', className].filter(Boolean).join(' ')} data-presentation-symbol-chip="" data-entity-id={entityId} {...props} /> }
