import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
export function Arrow({ id, className, style, label }: { id: string; className?: string; style?: CSSProperties; label?: string }) {
  return <motion.div layout layoutId={id} className={className} style={style} aria-label={label} data-presentation-node="arrow" data-presentation-entity={id} />
}
