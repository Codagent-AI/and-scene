import type { PropsWithChildren } from 'react'
import { AnimatePresence } from 'motion/react'
export function SceneLayer({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={className} data-presentation-scene-layer=""><AnimatePresence mode="popLayout" initial={false}>{children}</AnimatePresence></div>
}
