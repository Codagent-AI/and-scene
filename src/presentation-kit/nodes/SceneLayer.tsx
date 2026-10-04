import { AnimatePresence } from 'motion/react'
import { Children, type CSSProperties, type ReactNode } from 'react'
export function SceneLayer({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) { return <div className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }}><AnimatePresence>{Children.toArray(children)}</AnimatePresence></div> }
