import type { CSSProperties, HTMLAttributes } from 'react'
import { AnimatePresence } from 'motion/react'
export function SceneLayer({ children, className, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  const layerStyle: CSSProperties = { position: 'absolute', inset: 0, ...style }
  return <div {...props} className={['scene-layer', className].filter(Boolean).join(' ')} style={layerStyle} data-presentation-layer=""><AnimatePresence initial={false}>{children}</AnimatePresence></div>
}
