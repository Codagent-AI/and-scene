import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { ENTER_T, LAYOUT_T } from '../constants'
export interface NodeProps { id?: string; children?: ReactNode; className?: string; style?: CSSProperties; 'data-allow-overlap'?: boolean; Icon?: LucideIcon }
export function Node({ id, children, className, style, Icon, kind, ...data }: NodeProps & { kind: string }) {
  return <motion.div {...data} data-presentation-node={kind} data-entity-id={id} layoutId={id} layout transition={{ layout: LAYOUT_T }} className={className} style={style}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
export function Appear({ children, ...props }: NodeProps) { return <motion.div {...props} data-presentation-appear initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={ENTER_T}>{children}</motion.div> }
export function SceneLayer({ children, style, ...props }: NodeProps) { return <div {...props} data-presentation-layer style={{ position: 'absolute', inset: 0, ...style }}>{children}</div> }
