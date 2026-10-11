import { Node } from './Node';
import type { NodeProps } from './Node';
export function Box(props: NodeProps) { return <Node {...props} kind="box"/>; }
