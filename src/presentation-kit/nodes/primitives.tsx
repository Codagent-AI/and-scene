import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_T, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { entityId: string; Icon?: LucideIcon; children?: ReactNode }
function node(kind: string) {
  return function Node({ entityId, Icon, children, ...props }: NodeProps) {
    return <motion.div layout layoutId={entityId} transition={{ layout: LAYOUT_T }} exit={{ opacity: 0, transition: { duration: 0.2 } }} data-presentation-node={kind} data-presentation-entity={entityId} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
  }
}
export const Box = node('box')
export const Label = node('label')
export const Arrow = node('arrow')
export const Frame = node('frame')
export const Emphasis = node('emphasis')
export const SymbolChip = node('symbol-chip')
export function Appear(props: HTMLMotionProps<'div'>) { return <motion.div data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={ENTER_T} {...props} /> }
export function SceneLayer({ style, ...props }: HTMLMotionProps<'div'>) { return <motion.div data-presentation-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props} /> }
