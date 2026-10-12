import { PresentationNode } from "./PresentationNode";
import type { NodeProps } from "../types";
export function Arrow(props: NodeProps & { children?: React.ReactNode }) {
  return <PresentationNode node="arrow" {...props} />;
}
