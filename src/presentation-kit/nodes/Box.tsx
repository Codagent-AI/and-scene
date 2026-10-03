import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
type BoxMotionProps = Omit<HTMLMotionProps<'div'>, 'id' | 'children' | 'layout' | 'layoutId' | 'initial' | 'animate' | 'exit' | 'transition'>
export function Box({ id, children, className, style, icon: Icon, ...props }: { id: string; children: ReactNode; className?: string; style?: HTMLMotionProps<'div'>['style']; icon?: LucideIcon } & BoxMotionProps) {
  return <motion.div {...props} layout layoutId={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: ENTER_T, delay: ENTER_DELAY }, layout: { duration: 0.55 } }} className={className} style={style} data-presentation-node="box" data-entity-id={id}>{Icon && <Icon aria-hidden="true" />} {children}</motion.div>
}
