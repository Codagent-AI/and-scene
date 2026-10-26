import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

type BoxProps = { children?: ReactNode; className?: string; layoutId: string; style?: CSSProperties }

export function Box({ children, className, layoutId, style }: BoxProps) {
  return <motion.div className={className} data-presentation-box="true" data-presentation-entity={layoutId} layoutId={layoutId} style={style}>{children}</motion.div>
}
