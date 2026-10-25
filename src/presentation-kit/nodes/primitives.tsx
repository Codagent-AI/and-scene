import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_T, LAYOUT_T } from '../constants'

export type NodeProps = HTMLMotionProps<'div'> & { entityId: string }
export function Node({ entityId, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ layout: LAYOUT_T, opacity: ENTER_T }} data-presentation-entity={entityId} {...props}>{children}</motion.div>
}
export function Box({ Icon, ...props }: NodeProps & { Icon?: LucideIcon }) {
  return <Node data-presentation-node="box" {...props}>{Icon && <Icon aria-hidden="true" data-presentation-glyph="" />}{props.children}</Node>
}
export function Label(props: NodeProps) { return <Node data-presentation-node="label" {...props} /> }
export function Arrow(props: NodeProps) { return <Node data-presentation-node="arrow" {...props} /> }
export function Frame(props: NodeProps) { return <Node data-presentation-node="frame" {...props} /> }
export function Emphasis(props: NodeProps) { return <Node data-presentation-node="emphasis" {...props} /> }
export function SymbolChip(props: NodeProps) { return <Node data-presentation-node="symbol-chip" {...props} /> }
export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={ENTER_T} {...props} />
}
export function SceneLayer({ style, ...props }: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props} />
}
