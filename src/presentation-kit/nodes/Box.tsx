import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
import type { StyleProps } from '../types'

export function Box({ id, children, className, style, label, ...props }: StyleProps & { id: string; children?: ReactNode; label?: string }) {
  return <motion.div layout layoutId={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T, delay: ENTER_DELAY } }} aria-label={label} className={['scene-box', className].filter(Boolean).join(' ')} style={style as CSSProperties} data-scene-entity={id} {...props}>{children}</motion.div>
}
