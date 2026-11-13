import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { EASE, LAYOUT_T } from "../constants";
export type NodeProps = HTMLMotionProps<"div"> & {
  id: string;
  Icon?: LucideIcon;
};
export function node(kind: string) {
  return function Node({ id, Icon, children, ...props }: NodeProps) {
    return (
      <motion.div
        layout
        layoutId={id}
        data-presentation-node={kind}
        data-presentation-entity={id}
        transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
        {...props}
      >
        {Icon && <Icon aria-hidden="true" />}
        {children}
      </motion.div>
    );
  };
}
