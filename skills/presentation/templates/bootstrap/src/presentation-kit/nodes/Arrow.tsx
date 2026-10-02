import { motion } from 'motion/react'
import type { PrimitiveProps } from '../types'
export interface ArrowProps extends PrimitiveProps { from?: string; to?: string; direction?: 'forward' | 'back' | 'both' }
export function Arrow({ id, from, to, direction = 'forward', className = '', style, children }: ArrowProps) { return <motion.div layoutId={id} className={`scene-arrow ${className}`.trim()} data-presentation-node="arrow" data-presentation-entity={id} data-presentation-from={from} data-presentation-to={to} data-presentation-direction={direction} style={style} aria-hidden={!children}>{children ?? (direction === 'both' ? '↔' : direction === 'back' ? '←' : '→')}</motion.div> }
