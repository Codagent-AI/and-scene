import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { identity: string; glyph?: LucideIcon; children?: ReactNode }
export function Node({ identity, glyph: Glyph, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={identity} data-presentation-entity={identity} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.2 } }} {...props}>{Glyph && <Glyph aria-hidden="true" />}{children}</motion.div>
}
