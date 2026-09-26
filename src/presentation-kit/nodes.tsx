import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

type NodeProps = { id: string; className?: string; style?: CSSProperties; children?: ReactNode; [key: `data-${string}`]: unknown }
export function Box({ id, className, style, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} className={className} style={style} data-presentation-box="" {...props}>{children}</motion.div> }
export function Label({ id, className, style, children, ...props }: NodeProps) { return <motion.span layout layoutId={id} className={className} style={style} data-presentation-label="" {...props}>{children}</motion.span> }
export function Frame({ id, className, style, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} className={className} style={style} data-presentation-frame="" {...props}>{children}</motion.div> }
export function Emphasis({ id, className, style, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} className={className} style={style} data-presentation-emphasis="" {...props}>{children}</motion.div> }
export function SymbolChip({ id, className, style, children, ...props }: NodeProps) { return <motion.span layout layoutId={id} className={className} style={style} data-presentation-symbol="" {...props}>{children}</motion.span> }
export function Arrow({ id, className, style, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} className={className} style={style} data-presentation-arrow="" {...props}>{children}</motion.div> }
export function Appear({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, delay: 0.58 }} className={className} style={style} data-presentation-appear="">{children}</motion.div> }
export function SceneLayer({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) { return <div className={className} style={{ position: 'absolute', inset: 0, ...style }} data-presentation-scene-layer="">{children}</div> }
