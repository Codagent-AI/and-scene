import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

type FrameProps = { children?: ReactNode; className?: string; layoutId: string; style?: CSSProperties }

export function Frame({ children, className, layoutId, style }: FrameProps) {
  return <motion.div className={className} data-presentation-frame="true" data-presentation-entity={layoutId} layoutId={layoutId} style={style}>{children}</motion.div>
}
