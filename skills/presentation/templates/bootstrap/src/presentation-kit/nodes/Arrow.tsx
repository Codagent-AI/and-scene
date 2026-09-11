import { motion } from 'motion/react'
import type { SceneNodeProps } from './shared.ts'
import { nodeProps, sceneLayoutId } from './shared.ts'

export function Arrow({ children, ...props }: SceneNodeProps) {
  return (
    <motion.div {...nodeProps(props, 'arrow', sceneLayoutId(props.id))} aria-hidden={children ? undefined : true}>
      {children ?? '→'}
    </motion.div>
  )
}
