import { motion, type HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { LAYOUT_T } from '../constants'

export type NodeProps = Omit<HTMLMotionProps<'div'>, 'id' | 'children'> & { children?: ReactNode; id: string; Icon?: LucideIcon; 'data-presentation-allow-overlap'?: string }
function node(kind: string) {
  return function Node({ id, Icon, children, ...props }: NodeProps) {
    return <motion.div layout layoutId={id} transition={{ layout: LAYOUT_T }} data-presentation-node={kind} data-entity-id={id} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
  }
}
export const Box = node('box')
export const Label = node('label')
export const Arrow = node('arrow')
export const Frame = node('frame')
export const Emphasis = node('emphasis')
export const SymbolChip = node('symbol-chip')
