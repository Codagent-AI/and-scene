import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
import { cx } from '../utils'

export type SceneNodeProps = HTMLMotionProps<'div'> & { entityId: string }

/** Builds a morphing scene entity: a layout-animated `motion.div` keyed by `entityId` with a stable `data-presentation-*` hook. */
export function createSceneNode(baseClassName: string, hook: `data-presentation-${string}`, defaults: HTMLMotionProps<'div'> = {}) {
  return function SceneNode({ entityId, className, ...props }: SceneNodeProps) {
    return <motion.div layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }} className={cx(baseClassName, className)} {...defaults} {...{ [hook]: '' }} data-entity-id={entityId} {...props} />
  }
}
