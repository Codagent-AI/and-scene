import { motion, type HTMLMotionProps } from 'motion/react'
export function SymbolChip({ layoutId, ...props }: HTMLMotionProps<'span'> & { layoutId: string }) { return <motion.span layout layoutId={layoutId} data-presentation-symbol-chip {...props} /> }
