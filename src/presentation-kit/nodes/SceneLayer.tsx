import { AnimatePresence } from 'motion/react'
import { cloneElement, isValidElement } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
type Props = HTMLAttributes<HTMLDivElement> & { className?: string; style?: CSSProperties }
type IdentityProps = { id?: string; layoutId?: string; children?: ReactNode }

function identityOf(node: ReactNode, index: number): string {
  if (isValidElement<IdentityProps>(node)) {
    return node.props.id ?? node.props.layoutId ?? node.key ?? `child-${index}`
  }
  if (Array.isArray(node)) return `group-${node.map(identityOf).join('|')}`
  return `child-${index}`
}

function keyed(children: ReactNode, scope = 'scene'): ReactNode {
  const result: ReactNode[] = []
  const append = (child: ReactNode, index: number, arrayScope: string) => {
    if (Array.isArray(child)) {
      const groupScope = `${arrayScope}/group:${JSON.stringify(child.map(identityOf))}`
      child.forEach((nested, nestedIndex) => append(nested, nestedIndex, groupScope))
      return
    }
    if (child && typeof child !== 'string' && Symbol.iterator in Object(child) && !isValidElement(child)) {
      const items = Array.from(child as Iterable<ReactNode>)
      const groupScope = `${arrayScope}/group:${JSON.stringify(items.map(identityOf))}`
      items.forEach((nested, nestedIndex) => append(nested, nestedIndex, groupScope))
      return
    }
    if (!isValidElement<IdentityProps>(child)) {
      result.push(child)
      return
    }
    const identity = child.key != null
      ? `${arrayScope}:${child.key}`
      : child.props.id ?? child.props.layoutId ?? `${arrayScope}:scene-child-${index}`
    result.push(cloneElement(child, {
      key: identity,
      ...(child.props.children !== undefined ? { children: keyed(child.props.children, identity) } : {}),
    }))
  }
  if (Array.isArray(children)) {
    const groupScope = `${scope}/group:${JSON.stringify(children.map(identityOf))}`
    children.forEach((child, index) => append(child, index, groupScope))
  } else if (children && typeof children !== 'string' && Symbol.iterator in Object(children) && !isValidElement(children)) {
    const items = Array.from(children as Iterable<ReactNode>)
    const groupScope = `${scope}/group:${JSON.stringify(items.map(identityOf))}`
    items.forEach((child, index) => append(child, index, groupScope))
  } else {
    append(children, 0, scope)
  }
  return result
}

export function SceneLayer({ className, style, children, ...props }: Props) { return <div className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props}><AnimatePresence initial={false} mode="sync">{keyed(children)}</AnimatePresence></div> }
