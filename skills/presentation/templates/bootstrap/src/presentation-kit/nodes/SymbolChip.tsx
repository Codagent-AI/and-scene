import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { entityTransition } from './transitions'

export function SymbolChip(props: HTMLMotionProps<'span'>) {
  return <motion.span data-presentation-symbol-chip="" layout transition={entityTransition} {...props} />
}
