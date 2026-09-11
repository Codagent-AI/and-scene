import { motion } from 'motion/react'
import type { SceneNodeProps } from './shared.ts'
import { nodeProps, sceneLayoutId } from './shared.ts'

export function SymbolChip({ children, ...props }: SceneNodeProps) {
  return <motion.div {...nodeProps(props, 'symbol-chip', sceneLayoutId(props.id))}>{children}</motion.div>
}
