import { motion } from 'motion/react'
import type { SceneNodeProps } from './shared.ts'
import { nodeProps, sceneLayoutId } from './shared.ts'

export function Emphasis({ children, ...props }: SceneNodeProps) {
  return <motion.div {...nodeProps(props, 'emphasis', sceneLayoutId(props.id))}>{children}</motion.div>
}
