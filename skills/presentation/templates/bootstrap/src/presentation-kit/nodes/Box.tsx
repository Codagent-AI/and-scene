import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'children'> { layoutId: string; Icon?: LucideIcon; children?: ReactNode }
export function Box({ Icon, children, transition, ...props }: NodeProps) {
  return <motion.div data-presentation-box="" layout transition={{ layout: { duration: LAYOUT_T, ease: EASE }, ...transition }} {...props}>{Icon && <Icon data-presentation-glyph="" />}{children}</motion.div>
}
