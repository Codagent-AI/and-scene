import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'

interface EmphasisProps { layoutId: string; children?: ReactNode; className?: string; style?: CSSProperties }

export function Emphasis({ layoutId, children, className, style }: EmphasisProps) {
  return <motion.div layout data-presentation-node="emphasis" data-presentation-entity={layoutId} layoutId={layoutId} className={className} style={style}>{children}</motion.div>
}
