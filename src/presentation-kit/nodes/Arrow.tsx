import { motion } from 'motion/react'
import { entityMotion } from './entityMotion'
import type { CSSProperties } from 'react'
export function Arrow({ id, className, style, label }: { id: string; className?: string; style?: CSSProperties; label?: string }) { return <motion.div layout layoutId={id} {...entityMotion} className={className} style={style} aria-label={label} data-presentation-node="arrow" data-entity-id={id} /> }
