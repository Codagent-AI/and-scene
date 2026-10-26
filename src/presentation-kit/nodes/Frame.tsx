import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'

interface FrameProps { layoutId: string; children?: ReactNode; className?: string; style?: CSSProperties }

export function Frame({ layoutId, children, className, style }: FrameProps) {
  return <motion.div layout data-presentation-node="frame" data-presentation-entity={layoutId} layoutId={layoutId} className={className} style={style}>{children}</motion.div>
}
