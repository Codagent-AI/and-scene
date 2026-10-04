import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY } from '../constants'
import type { CSSProperties, ReactNode } from 'react'
type NodeProps = { id: string; className?: string; style?: CSSProperties; children?: ReactNode; 'data-kind'?: string }
export function Box({ id, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} data-presentation-node="box" {...props}>{children}</motion.div> }
export function Label({ id, children, ...props }: NodeProps) { return <motion.span layout layoutId={id} data-presentation-node="label" {...props}>{children}</motion.span> }
export function Arrow({ id, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} data-presentation-node="arrow" {...props}>{children}</motion.div> }
export function Frame({ id, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} data-presentation-node="frame" {...props}>{children}</motion.div> }
export function Emphasis({ id, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} data-presentation-node="emphasis" {...props}>{children}</motion.div> }
export function SymbolChip({ id, children, ...props }: NodeProps) { return <motion.span layout layoutId={id} data-presentation-node="symbol-chip" {...props}>{children}</motion.span> }
export function Appear({ children, delay = ENTER_DELAY, className, style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
 return <motion.div className={className} style={style} data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay }}>{children}</motion.div>
}
export function SceneLayer({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
 return <div className={className} style={{ position: 'absolute', inset: 0, ...style }} data-presentation-layer="">{children}</div>
}
export type MotionNodeProps = HTMLMotionProps<'div'>
