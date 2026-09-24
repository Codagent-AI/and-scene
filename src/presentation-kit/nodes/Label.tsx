import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
export function Label({ id, children, className = '', style, ...props }: { id: string; children: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: string | undefined }) {
  return <motion.div layout layoutId={id} className={`scene-label ${className}`.trim()} data-presentation-node="label" data-entity-id={id} style={style} initial={{ opacity: 0, transition: { duration: ENTER_T, delay: ENTER_DELAY } }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: ENTER_T } }} transition={LAYOUT_T} {...props}>{children}</motion.div>
}
