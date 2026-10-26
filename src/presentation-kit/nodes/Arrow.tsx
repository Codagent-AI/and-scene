import { motion } from 'motion/react'
import type { CSSProperties } from 'react'

type ArrowProps = { className?: string; layoutId: string; style?: CSSProperties }

export function Arrow({ className, layoutId, style }: ArrowProps) {
  return <motion.span aria-hidden="true" className={className} data-presentation-arrow="true" data-presentation-entity={layoutId} layoutId={layoutId} style={style}>→</motion.span>
}
