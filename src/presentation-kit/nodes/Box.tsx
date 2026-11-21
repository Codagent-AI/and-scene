import type { LucideIcon } from 'lucide-react'
import { Entity } from './Entity'
import type { EntityProps } from './Entity'

type BoxProps = EntityProps & { icon?: LucideIcon }

export function Box({ icon: Icon, children, ...props }: BoxProps) {
  return <Entity {...props} kind="box">{Icon && <Icon aria-hidden="true" />}{children}</Entity>
}
