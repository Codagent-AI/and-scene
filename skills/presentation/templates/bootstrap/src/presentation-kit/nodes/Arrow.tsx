import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
export function Arrow({ id, className = '', style, ...props }: { id: string; className?: string; style?: CSSProperties; label?: string; 'aria-label'?: string; [key: `data-${string}`]: string | undefined }) {
  return <motion.div layout layoutId={id} className={`scene-arrow ${className}`.trim()} data-presentation-node="arrow" data-entity-id={id} style={style} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { opacity: { duration: ENTER_T, delay: ENTER_DELAY } } }} exit={{ opacity: 0, transition: { duration: ENTER_T } }} transition={{ layout: LAYOUT_T }} {...props} aria-hidden={props['aria-label'] ? undefined : true}>→</motion.div>
}
