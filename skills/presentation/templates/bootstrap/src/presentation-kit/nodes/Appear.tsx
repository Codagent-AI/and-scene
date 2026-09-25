import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
import type { PrimitiveProps } from '../types'

export function Appear({ className, children, ...props }: PrimitiveProps) {
  return <motion.div className={['scene-appear', className].filter(Boolean).join(' ')} data-presentation-appear="" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: ENTER_DELAY, duration: ENTER_T }} {...props}>{children}</motion.div>
}
