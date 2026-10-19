import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Absolutely positioned layer for a scene's entities. Mounting one layer never
 * reflows another, and entities removed from `children` animate out.
 */
export function SceneLayer({ children, ...rest }: { children?: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} style={{ position: 'absolute', inset: 0, ...rest.style }} data-presentation-layer="">
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
