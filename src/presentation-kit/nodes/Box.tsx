import type { LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Node } from './shared'
export function Box({ Icon, children, ...props }: ComponentProps<typeof Node> & { Icon?: LucideIcon }) { return <Node {...props}>{Icon && <Icon aria-hidden="true" />}{children}</Node> }
