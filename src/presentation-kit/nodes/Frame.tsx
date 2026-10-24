import { Node, type NodeProps } from './Node'

/** Outline region drawn around other entities; children usually hold its caption. */
export function Frame(props: NodeProps) {
  return <Node kind="frame" {...props} />
}
