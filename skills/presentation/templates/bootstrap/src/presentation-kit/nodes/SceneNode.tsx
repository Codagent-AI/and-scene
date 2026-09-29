import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { HTMLMotionProps } from 'motion/react'

export type SceneNodeProps = {
  id: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
} & Omit<HTMLMotionProps<'div'>, 'id' | 'style' | 'className' | 'children' | 'layout' | 'layoutId'>

// Shared layout-projected entity: `kind` drives the `scene-<kind>` class and data-presentation-node hook.
export function SceneNode({ kind, id, children, className, style, ...props }: SceneNodeProps & { kind: string }) {
  return <motion.div layout layoutId={id} className={[`scene-${kind}`, className].filter(Boolean).join(' ')} data-presentation-node={kind} data-presentation-entity={id} style={style} {...props}>{children}</motion.div>
}
