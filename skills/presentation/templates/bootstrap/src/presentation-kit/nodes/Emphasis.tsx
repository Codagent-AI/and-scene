import type { NodeProps } from "../types";
import { PresentationNode } from "./PresentationNode";
export function Emphasis({
  entityId,
  layoutId = entityId,
  children,
  ...props
}: NodeProps & { children?: React.ReactNode }) {
  return (
    <PresentationNode node="emphasis" entityId={entityId} layoutId={layoutId} {...props}>
      {children}
    </PresentationNode>
  );
}
