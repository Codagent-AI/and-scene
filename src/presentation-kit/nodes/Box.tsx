import { motion } from 'motion/react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import type { HTMLMotionProps } from 'motion/react'
export function Box({ id, children, className, style, glyph: Glyph, ...props }: { id: string; children: ReactNode; className?: string; style?: CSSProperties; glyph?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }> } & Omit<HTMLMotionProps<'div'>, 'id' | 'style' | 'className' | 'children' | 'layout' | 'layoutId'>) {
  return <motion.div layout layoutId={id} className={['scene-box', className].filter(Boolean).join(' ')} data-presentation-node="box" data-presentation-entity={id} style={style} {...props}>{Glyph && <Glyph aria-hidden={true} />}{children}</motion.div>
}
