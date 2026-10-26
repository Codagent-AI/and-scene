import type { ComponentPropsWithoutRef, CSSProperties } from 'react'
import { motion } from 'motion/react'

export interface SceneLayerProps extends ComponentPropsWithoutRef<typeof motion.div> {
  layoutId?: string
}

const LAYER_STYLE: CSSProperties = { position: 'absolute', inset: 0 }

export function SceneLayer({ style, children, ...rest }: SceneLayerProps) {
  return (
    <motion.div
      data-presentation-node="scene-layer"
      style={{ ...LAYER_STYLE, ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
