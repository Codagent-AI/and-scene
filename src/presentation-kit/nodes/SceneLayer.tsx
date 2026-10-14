import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, EASE } from '../constants'
import { hookAttrs, HOOK } from '../hooks'
import type { NodeCommonProps } from './shared'

export interface SceneLayerProps extends NodeCommonProps {
  children: ReactNode
}

/**
 * Covers the design canvas for one step's diagram. Each layer is absolutely
 * positioned, so mounting or unmounting one never reflows another.
 */
export function SceneLayer({ id, children, className, style, data }: SceneLayerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T, ease: EASE }}
      className={className}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: DESIGN_W,
        height: DESIGN_H,
        ...style,
      }}
      {...hookAttrs(HOOK.sceneLayer, id ?? '')}
      {...data}
    >
      {children}
    </motion.div>
  )
}
