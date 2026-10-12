import { motion, type HTMLMotionProps } from 'motion/react'
export type BoxProps = HTMLMotionProps<'div'> & { layoutId: string; 'data-presentation-allow-overlap'?: boolean }
export function Box(props: BoxProps) { return <motion.div {...props} layout layoutId={props.layoutId} data-presentation-node="box" /> }
