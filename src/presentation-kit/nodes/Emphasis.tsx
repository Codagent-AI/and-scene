import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

type EmphasisProps = { children?: ReactNode; className?: string; layoutId: string; style?: CSSProperties }

export function Emphasis({ children, className, layoutId, style }: EmphasisProps) {
  return <motion.span className={className} data-presentation-emphasis="true" data-presentation-entity={layoutId} layoutId={layoutId} style={style}>{children}</motion.span>
}
