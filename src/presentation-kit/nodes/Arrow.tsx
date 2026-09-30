import { motion, type SVGMotionProps } from 'motion/react'

export interface ArrowProps extends SVGMotionProps<SVGSVGElement> {
  layoutId: string
}

export function Arrow({ layoutId, ...props }: ArrowProps) {
  return (
    <motion.svg layout layoutId={layoutId} data-presentation-arrow="true" {...props}>
      <path d="M0 0H100" />
      <path d="m92 -8 8 8-8 8" />
    </motion.svg>
  )
}
