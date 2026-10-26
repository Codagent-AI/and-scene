import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { classNames } from './classNames'

export interface ArrowProps {
  /** Stable identity so this entity morphs in place across steps. */
  layoutId?: string
  /** Rotation in degrees; 0 points right. */
  rotation?: number
  className?: string
  style?: CSSProperties
}

/** Generic directional connector primitive with no default stroke or color. */
export function Arrow({ layoutId, rotation = 0, className, style }: ArrowProps) {
  return (
    <motion.svg
      layoutId={layoutId}
      layout={layoutId ? true : undefined}
      viewBox="0 0 24 24"
      className={classNames('sk-arrow', className)}
      style={{ rotate: rotation, ...style }}
      data-scene-kit="arrow"
      aria-hidden="true"
    >
      <path d="M4 12h13M13 6l7 6-7 6" fill="none" stroke="currentColor" strokeWidth={2} />
    </motion.svg>
  )
}
