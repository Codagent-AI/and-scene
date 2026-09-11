import { motion } from 'motion/react'
import type { SceneNodeProps } from './shared.ts'
import { nodeProps, sceneLayoutId } from './shared.ts'

export function Label({ children, ...props }: SceneNodeProps) {
  return <motion.span {...nodeProps(props, 'label', sceneLayoutId(props.id))}>{children}</motion.span>
}
