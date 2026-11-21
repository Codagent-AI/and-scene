import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Label({ children, label, ...props }: EntityProps) {
  return typeof children === 'string' && label === undefined
    ? <Entity {...props} kind="label" label={children} />
    : <Entity {...props} kind="label" label={label}>{children}</Entity>
}
