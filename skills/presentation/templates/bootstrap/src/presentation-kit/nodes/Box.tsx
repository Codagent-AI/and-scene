import { Primitive } from './Primitive'
import type { NodeProps } from './Primitive'
export function Box(props: NodeProps) { return <Primitive {...props} kind="Box" /> }
