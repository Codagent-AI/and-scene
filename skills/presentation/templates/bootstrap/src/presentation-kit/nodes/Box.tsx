import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Box({ icon: Icon, children, ...props }: Omit<EntityProps, 'children'> & { icon?: LucideIcon; children?: ReactNode }) {
  return <Entity data-presentation-box="" {...props}>{Icon && <Icon aria-hidden />}{children}</Entity>
}
