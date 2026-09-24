import type { CSSProperties, ReactNode } from 'react'
import { Children, cloneElement, isValidElement } from 'react'
import { AnimatePresence } from 'motion/react'
export function SceneLayer({ children, className, style, ...props }: { children?: ReactNode; className?: string; style?: CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  const identifiedChildren = Children.map(children, (child, index) => {
    if (!isValidElement(child) || child.key !== null) return child
    const childProps = child.props as { entityId?: string; 'data-entity-id'?: string }
    const key = childProps.entityId ?? childProps['data-entity-id'] ?? `scene-child-${index}`
    return cloneElement(child, { key })
  })
  return <div className={['scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence mode="popLayout">{identifiedChildren}</AnimatePresence></div>
}
