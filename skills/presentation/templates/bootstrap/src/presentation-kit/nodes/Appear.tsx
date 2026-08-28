import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

type AppearProps = { children: ReactNode; className?: string; style?: CSSProperties }

export function Appear({ children, className, style }: AppearProps) {
  return <motion.div animate={{ opacity: 1 }} className={className} data-presentation-appear="true" initial={{ opacity: 0 }} style={style} transition={{ delay: ENTER_DELAY, duration: ENTER_T, ease: EASE }}>{children}</motion.div>
}
