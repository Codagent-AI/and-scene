import { motion } from 'motion/react'
import type { StyleProps } from '../types'
export function Arrow({ id, className, style, label, ...props }: StyleProps & { id?: string; label?: string }) {
  return <motion.div layout layoutId={id} className={['scene-arrow', className].filter(Boolean).join(' ')} style={style} aria-label={label} aria-hidden={label ? undefined : true} data-scene-entity={id} {...props}>→</motion.div>
}
