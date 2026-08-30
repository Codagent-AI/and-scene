import { AnimatePresence } from 'motion/react'
import type { SceneStyleProps } from '../types'
import { classNames } from '../utils'

export function SceneLayer({ className, style, children }: SceneStyleProps) {
  return (
    <div
      className={classNames('presentation-scene-layer', className)}
      data-presentation-scene-layer="true"
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
