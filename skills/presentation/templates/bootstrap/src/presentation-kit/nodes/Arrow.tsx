import { motion } from 'motion/react'
import type { StyleProps } from '../types'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
export function Arrow({ id, className, style, label, ...props }: StyleProps & { id?: string; label?: string }) {
  return <motion.div layout layoutId={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T, delay: ENTER_DELAY } }} className={['scene-arrow', className].filter(Boolean).join(' ')} style={style} aria-label={label} aria-hidden={label ? undefined : true} data-scene-entity={id} {...props}>→</motion.div>
}
