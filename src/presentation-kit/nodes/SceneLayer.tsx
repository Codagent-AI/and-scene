import { AnimatePresence } from 'motion/react'
import type { ComponentPropsWithoutRef } from 'react'

/**
 * Absolutely positions one step's diagram inside the canvas so mounting one
 * layer never reflows another, and hosts presence so removed children exit.
 */
export function SceneLayer({ children, style, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-presentation-scene-layer=""
      {...rest}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
