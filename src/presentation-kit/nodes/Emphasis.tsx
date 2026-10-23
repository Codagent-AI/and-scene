import { DivNode } from './DivNode'
import type { NodeProps } from './types'

/** Decorative marker drawn over another entity to call attention to it. */
export const Emphasis = (props: NodeProps) => <DivNode kind="emphasis" aria-hidden="true" {...props} />
