import { AnimatePresence } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { dataHooks, type DataHooks } from './geometry'

export interface SceneLayerProps extends DataHooks {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Absolutely positions a step's diagram; keyed children exit through AnimatePresence. */
export function SceneLayer({ className, style, children, ...hooks }: SceneLayerProps) {
  return (
    <div
      {...dataHooks(hooks)}
      data-presentation-layer=""
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
