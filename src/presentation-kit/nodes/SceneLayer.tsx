import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
export function SceneLayer({ children, className, style, ...props }: { children?: ReactNode; className?: string; style?: CSSProperties } & React.HTMLAttributes<HTMLDivElement>) { return <div className={['scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence mode="popLayout">{children}</AnimatePresence></div> }
