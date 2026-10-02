import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import type { StyleProps } from '../types'
export function SceneLayer({ children, className, style, ...props }: StyleProps & { children: ReactNode }) {
  const layerStyle: CSSProperties = { position: 'absolute', inset: 0, ...style }
  return <div className={['scene-layer', className].filter(Boolean).join(' ')} style={layerStyle} data-scene-layer {...props}><AnimatePresence mode="sync" initial={false}>{children}</AnimatePresence></div>
}
