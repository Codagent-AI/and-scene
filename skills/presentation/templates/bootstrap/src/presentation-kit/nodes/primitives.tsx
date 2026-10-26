import type { CSSProperties, ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T, ENTER_DELAY, ENTER_T } from '../constants'
export type NodeProps = HTMLMotionProps<'div'> & { id: string; Icon?: LucideIcon; children?: ReactNode; style?: CSSProperties }
export function Box({ id, Icon, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} data-presentation-node="box" transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div> }
export function Label({ id, children, ...props }: NodeProps) { return <Box id={id} {...props} data-presentation-node="label">{children}</Box> }
export function Arrow({ id, children, ...props }: NodeProps) { return <Box id={id} {...props} data-presentation-node="arrow">{children}</Box> }
export function Frame({ id, children, ...props }: NodeProps) { return <Box id={id} {...props} data-presentation-node="frame">{children}</Box> }
export function Emphasis({ id, children, ...props }: NodeProps) { return <Box id={id} {...props} data-presentation-node="emphasis">{children}</Box> }
export function SymbolChip({ id, children, ...props }: NodeProps) { return <Box id={id} {...props} data-presentation-node="symbol-chip">{children}</Box> }
export function Appear({ children, ...props }: HTMLMotionProps<'div'>) { return <motion.div data-presentation-appear="" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} {...props}>{children}</motion.div> }
export function SceneLayer({ children, style, ...props }: HTMLMotionProps<'div'>) { return <motion.div data-presentation-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}>{children}</motion.div> }
