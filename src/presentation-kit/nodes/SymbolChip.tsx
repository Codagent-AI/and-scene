import { motion, type HTMLMotionProps } from 'motion/react'

export interface SymbolChipProps extends HTMLMotionProps<'span'> {
  layoutId: string
}

export function SymbolChip({ layoutId, ...props }: SymbolChipProps) {
  return <motion.span layout layoutId={layoutId} data-presentation-symbol-chip="true" {...props} />
}
