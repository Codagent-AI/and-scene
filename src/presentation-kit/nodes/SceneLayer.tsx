import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
export type SceneLayerProps = Omit<HTMLMotionProps<'div'>, 'children' | 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> & { id: string; children: ReactNode }
export function SceneLayer({ id, children, style, ...props }: SceneLayerProps) { return <motion.div layout layoutId={id} data-presentation-node="" data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}>{children}</motion.div> }
