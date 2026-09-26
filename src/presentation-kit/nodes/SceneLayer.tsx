import { AnimatePresence } from 'motion/react'
import { Children, cloneElement, isValidElement } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
type Props = HTMLAttributes<HTMLDivElement> & { className?: string; style?: CSSProperties }
function keyed(children: ReactNode): ReactNode {
  return Children.map(children, (child, index): ReactNode => {
    if (!isValidElement<{ id?: string; layoutId?: string; children?: ReactNode }>(child)) return child
    const identity = child.props.id ?? child.props.layoutId ?? `scene-child-${index}`
    const nested: ReactNode | undefined = child.props.children ? keyed(child.props.children) : undefined
    return cloneElement(child, { key: child.key ?? identity, ...(nested ? { children: nested } : {}) })
  })
}

export function SceneLayer({ className, style, children, ...props }: Props) { return <div className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence initial={false} mode="sync">{keyed(children)}</AnimatePresence></div> }
