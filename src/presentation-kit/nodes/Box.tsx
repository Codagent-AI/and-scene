import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { SceneNodeProps } from './shared.ts'
import { nodeProps, sceneLayoutId } from './shared.ts'

type BoxProps = SceneNodeProps & {
  label?: string
  icon?: LucideIcon
}

export function Box({ label, icon: Icon, children, ...props }: BoxProps) {
  return (
    <motion.div {...nodeProps(props, 'box', sceneLayoutId(props.id))} layout>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {children ?? label}
    </motion.div>
  )
}
