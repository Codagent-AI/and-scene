import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { LAYOUT_T } from "../constants";
export interface NodeProps extends Omit<
  HTMLMotionProps<"div">,
  "id" | "children"
> {
  id: string;
  Icon?: LucideIcon;
  children?: ReactNode;
}
export function createNode(kind: string) {
  return function Node({ id, Icon, children, ...props }: NodeProps) {
    return (
      <motion.div
        layout
        layoutId={id}
        transition={{ layout: LAYOUT_T }}
        exit={{ opacity: 0 }}
        data-presentation-node={kind}
        {...props}
      >
        {Icon && <Icon />}
        {children}
      </motion.div>
    );
  };
}
