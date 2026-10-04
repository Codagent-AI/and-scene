import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'
import type { LucideIcon } from 'lucide-react'

export interface SymbolChipProps extends Omit<HTMLMotionProps<'div'>, 'children'> { entityId: string; Icon?: LucideIcon; label: string }
export function SymbolChip({ entityId, Icon, label, className, ...props }: SymbolChipProps) {
  return <motion.div {...props} layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }} className={['presentation-symbol-chip', className].filter(Boolean).join(' ')} data-presentation-node="symbol-chip" data-presentation-id={entityId}>{Icon && <Icon aria-hidden="true" />}<span>{label}</span></motion.div>
}
