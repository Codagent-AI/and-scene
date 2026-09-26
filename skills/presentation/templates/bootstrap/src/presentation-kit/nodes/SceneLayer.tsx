import { AnimatePresence } from 'motion/react'
import { cloneElement, isValidElement } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
type Props = HTMLAttributes<HTMLDivElement> & { className?: string; style?: CSSProperties }
type IdentityProps = { id?: string; layoutId?: string; children?: ReactNode }

function keyed(children: ReactNode, scope = 'scene'): ReactNode {
  const result: ReactNode[] = []
  const append = (child: ReactNode, index: number, arrayScope: string) => {
    if (Array.isArray(child)) {
      appendList(child, `${arrayScope}:array:${index}`)
      return
    }
    if (child && typeof child !== 'string' && Symbol.iterator in Object(child) && !isValidElement(child)) {
      appendList(Array.from(child as Iterable<ReactNode>), `${arrayScope}:iterable:${index}`)
      return
    }
    if (!isValidElement<IdentityProps>(child)) {
      result.push(child)
      return
    }
    const entityId = child.props.id ?? child.props.layoutId
    const identity = child.key != null
      ? JSON.stringify([child.key, entityId ?? arrayScope])
      : entityId ?? `${arrayScope}:scene-child-${index}`
    result.push(cloneElement(child, {
      key: identity,
      ...(child.props.children !== undefined ? { children: keyed(child.props.children, identity) } : {}),
    }))
  }
  const appendList = (items: ReactNode[], arrayScope: string) => {
    items.forEach((child, index) => append(child, index, arrayScope))
  }
  if (Array.isArray(children)) {
    appendList(children, scope)
  } else if (children && typeof children !== 'string' && Symbol.iterator in Object(children) && !isValidElement(children)) {
    appendList(Array.from(children as Iterable<ReactNode>), scope)
  } else {
    append(children, 0, scope)
  }
  return result
}

export function SceneLayer({ className, style, children, ...props }: Props) { return <div className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence initial={false} mode="sync">{keyed(children)}</AnimatePresence></div> }
