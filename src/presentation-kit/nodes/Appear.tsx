import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear({ children, className = '', style, delay = ENTER_DELAY }: { children: ReactNode; className?: string; style?: CSSProperties; delay?: number }) { return <motion.div className={className} style={style} data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay }}>{children}</motion.div> }
