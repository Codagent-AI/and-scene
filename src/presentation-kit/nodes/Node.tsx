import { motion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { EASE, LAYOUT_T } from '../constants';
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'id' | 'children'> & {
    id: string;
    Icon?: LucideIcon;
    children?: ReactNode;
};
export function Node({ id, Icon, children, kind, ...props }: NodeProps & {
    kind: string;
}) {
    return <motion.div layout layoutId={id} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props} data-presentation-node={kind} data-presentation-entity={id}>{Icon && <Icon aria-hidden="true"/>}{children}</motion.div>;
}
