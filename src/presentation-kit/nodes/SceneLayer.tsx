import { AnimatePresence } from 'motion/react'
import { useContext, useState, type HTMLAttributes } from 'react'
import { EntryContext } from '../entryContext'

/**
 * Absolutely positioned layer filling the canvas, so mounting one layer never reflows another.
 * Children added or removed later enter and exit through AnimatePresence. A layer mounted by a
 * step change animates its newcomers in; one mounted with the stage itself shows them at once.
 */
export function SceneLayer({ style, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const [animateEntry] = useState(useContext(EntryContext))
  return (
    <div
      data-presentation-scene-layer=""
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', ...style }}
      {...rest}
    >
      <AnimatePresence initial={animateEntry}>{children}</AnimatePresence>
    </div>
  )
}
