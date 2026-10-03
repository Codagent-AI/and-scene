import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EASE } from '../constants.ts'
import type { SceneNodeProps } from './shared.ts'
import { nodeProps } from './shared.ts'

type AppearProps = SceneNodeProps & {
  isNew?: boolean
  delay?: number
}

export function Appear({ children, isNew = true, delay, ...props }: AppearProps) {
  const enterDelay = delay ?? (isNew ? ENTER_DELAY : 0)
  return (
    <motion.div
      {...nodeProps(props, 'appear')}
      initial={isNew ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T, delay: enterDelay, ease: EASE }}
      data-scene-appear={isNew ? 'new' : 'persisting'}
    >
      {children}
    </motion.div>
  )
}
