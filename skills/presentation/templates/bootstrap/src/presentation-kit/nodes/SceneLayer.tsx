import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { SceneEntranceContext } from './entity'

export function SceneLayer({ children, className, style, ...props }: { children: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: unknown }) {
  const [gate] = useState(() => ({ entering: false, open() { this.entering = true } }))
  useEffect(() => { gate.open() }, [gate])
  return <SceneEntranceContext.Provider value={gate}>
    <div className={['scene-layer', className].filter(Boolean).join(' ')} style={{ position: 'absolute', inset: 0, ...style }} data-scene-layer="" {...props}>{children}</div>
  </SceneEntranceContext.Provider>
}
