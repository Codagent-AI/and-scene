import { motion, type HTMLMotionProps } from 'motion/react'

interface SymbolChipProps extends HTMLMotionProps<'span'> { layoutId: string }

export function SymbolChip({ layoutId, className, ...props }: SymbolChipProps) {
  return <motion.span {...props} layout layoutId={layoutId} className={['presentation-symbol-chip', className].filter(Boolean).join(' ')} data-presentation-symbol-chip data-layout-id={layoutId} />
}
