import { Children, Fragment, isValidElement, type ReactNode } from 'react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'

type SceneLayerProps = Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode }

export function SceneLayer({ children, className, style, ...props }: SceneLayerProps) {
  // Keep child identities stable across conditional slots, including plain text.
  const layers = Children.toArray(children).map((child, index) => (
    <Fragment key={isValidElement(child) ? child.key : index}>{child}</Fragment>
  ))

  return (
    <motion.div
      {...props}
      className={['presentation-scene-layer', className].filter(Boolean).join(' ')}
      data-presentation-scene-layer
      style={{ position: 'absolute', ...style }}
    >
      <AnimatePresence propagate>{layers}</AnimatePresence>
    </motion.div>
  )
}
