import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export interface NodeProps { id: string; className?: string; style?: CSSProperties; children?: ReactNode; [key: `data-${string}`]: unknown }
export function Box({ id, className = '', style, children, ...props }: NodeProps) { return <motion.div layout layoutId={id} className={`scene-box ${className}`} style={style} data-presentation-node="box" {...props}>{children}</motion.div> }
