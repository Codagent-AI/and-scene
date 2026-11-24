import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
type Props = { id?: string; className?: string; style?: CSSProperties; children?: ReactNode; icon?: LucideIcon } & { [key: `data-${string}`]: string | undefined }
function Node({ id, icon: Icon, children, ...props }: Props) { return <motion.div layoutId={id} layout transition={{ layout: { duration: LAYOUT_T } }} data-presentation-node="node" {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div> }
export const Box = Node
export const Label = Node
export const Arrow = Node
export const Frame = Node
export const Emphasis = Node
export const SymbolChip = Node
export function Appear({ children }: { children: ReactNode }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }}>{children}</motion.div> }
export function SceneLayer({ children }: { children: ReactNode }) { return <div data-presentation-layer style={{ position: 'absolute', inset: 0 }}>{children}</div> }
