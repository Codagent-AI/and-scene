import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
const arrows = { left: '←', right: '→', up: '↑', down: '↓' } as const
export function Arrow({ id, className, style, direction = 'right', label }: { id: string; className?: string; style?: CSSProperties; direction?: 'left' | 'right' | 'up' | 'down'; label?: string }) {
  return <motion.div layout layoutId={id} exit={{ opacity: 0 }} className={['scene-arrow', className].filter(Boolean).join(' ')} data-presentation-node="arrow" data-entity-id={id} data-direction={direction} style={style} aria-label={label} aria-hidden={label ? undefined : true}>{arrows[direction]}</motion.div>
}
