import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { HTMLMotionProps } from 'motion/react'
export function Label({ id, children, className, style, ...props }: { id: string; children: ReactNode; className?: string; style?: CSSProperties } & Omit<HTMLMotionProps<'div'>, 'id' | 'style' | 'className' | 'children' | 'layout' | 'layoutId'>) {
  return <motion.div layout layoutId={id} className={['scene-label', className].filter(Boolean).join(' ')} data-presentation-node="label" data-presentation-entity={id} style={style} {...props}>{children}</motion.div>
}
