import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'

interface ArrowProps { layoutId: string; children?: ReactNode; className?: string; style?: CSSProperties }

export function Arrow({ layoutId, children, className, style }: ArrowProps) {
  return <motion.div layout data-presentation-node="arrow" data-presentation-entity={layoutId} layoutId={layoutId} className={className} style={style}>{children}</motion.div>
}
