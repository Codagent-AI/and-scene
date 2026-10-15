import type { ComponentProps } from 'react'
import { Node } from './shared'
export function Frame(props: ComponentProps<typeof Node>) { return <Node {...props} /> }
