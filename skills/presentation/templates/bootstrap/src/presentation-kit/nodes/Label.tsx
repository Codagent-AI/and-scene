import type { NodeProps } from "../types";
import { PresentationNode } from "./PresentationNode";
export function Label({
  entityId,
  layoutId = entityId,
  children,
  ...props
}: NodeProps & { children?: React.ReactNode }) {
  return (
    <PresentationNode node="label" entityId={entityId} layoutId={layoutId} {...props}>
      {children}
    </PresentationNode>
  );
}
