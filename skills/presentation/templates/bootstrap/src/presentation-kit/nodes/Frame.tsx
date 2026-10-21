import { Node, type NodeProps } from './Node'

/** A region drawn around other entities. Purely geometric; presentations style it. */
export function Frame(props: NodeProps) {
  return <Node kind="frame" {...props} />
}
