import { DivNode } from './DivNode'
import type { NodeProps } from './types'

/** A rectangle drawn around other entities; children (e.g. a label) are optional. */
export const Frame = (props: NodeProps) => <DivNode kind="frame" {...props} />
