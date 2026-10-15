import { AnimatePresence } from 'motion/react'
import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

export interface PresenceProps {
  children?: ReactNode
}

/**
 * Lets conditionally rendered entities animate out. Children that leave stay mounted until their
 * exit animation finishes. Keyless children are keyed by their `id` so entities keep identity.
 * Must be the direct parent of the entities that come and go; `SceneLayer` already does this.
 */
export function Presence({ children }: PresenceProps) {
  const keyed: ReactElement[] = []
  Children.forEach(children, (child, i) => {
    if (child === null || child === undefined || typeof child === 'boolean') return
    if (!isValidElement<{ id?: unknown }>(child)) {
      keyed.push(<Fragment key={`text:${i}`}>{child}</Fragment>)
    } else if (child.key !== null) {
      keyed.push(child)
    } else {
      const id = child.props.id
      keyed.push(cloneElement(child, { key: typeof id === 'string' ? `id:${id}` : `index:${i}` }))
    }
  })
  return <AnimatePresence>{keyed}</AnimatePresence>
}
