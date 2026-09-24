import type { CSSProperties, ReactNode } from 'react'
import { Children, cloneElement, isValidElement } from 'react'
import { AnimatePresence } from 'motion/react'
import { cx } from '../utils'
export function SceneLayer({ children, className, style, ...props }: { children?: ReactNode; className?: string; style?: CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  const identifiedChildren: ReactNode[] = []
  Children.forEach(children, (child, index) => {
    if (!isValidElement(child) || child.key !== null) {
      identifiedChildren.push(child)
      return
    }
    const childProps = child.props as { entityId?: string; 'data-entity-id'?: string }
    identifiedChildren.push(cloneElement(child, { key: childProps.entityId ?? childProps['data-entity-id'] ?? `scene-child-${index}` }))
  })
  return <div className={cx('scene-layer', className)} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence mode="popLayout">{identifiedChildren}</AnimatePresence></div>
}
