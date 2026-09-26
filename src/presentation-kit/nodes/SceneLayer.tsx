import { AnimatePresence } from 'motion/react'
import { Children, cloneElement, isValidElement } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
type Props = HTMLAttributes<HTMLDivElement> & { className?: string; style?: CSSProperties }
function keyed(children: ReactNode): ReactNode {
  const result: ReactNode[] = []
  Children.forEach(children, (child, index) => {
    if (!isValidElement<{ id?: string; layoutId?: string; children?: ReactNode }>(child)) {
      result.push(child)
      return
    }
    const identity = child.key ?? child.props.id ?? child.props.layoutId ?? `scene-child-${index}`
    result.push(cloneElement(child, {
      key: identity,
      ...(child.props.children !== undefined ? { children: keyed(child.props.children) } : {}),
    }))
  })
  return result
}

export function SceneLayer({ className, style, children, ...props }: Props) { return <div className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence initial={false} mode="sync">{keyed(children)}</AnimatePresence></div> }
