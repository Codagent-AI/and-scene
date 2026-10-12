import type { NodeProps } from "../types";
import { PresentationNode } from "./PresentationNode";
export function Frame({
  entityId,
  layoutId = entityId,
  children,
  ...props
}: NodeProps & { children?: React.ReactNode }) {
  return (
    <PresentationNode node="frame" entityId={entityId} layoutId={layoutId} {...props}>
      {children}
    </PresentationNode>
  );
}
