import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from './constants'
type Props = { icon?: LucideIcon; id?: string; className?: string; style?: CSSProperties; children?: ReactNode } & { [key: `data-${string}`]: string | number | boolean | undefined }
export function Box({id, icon: Icon, className, style, children, ...rest}: Props) { return <motion.div {...rest} layoutId={id} data-presentation-box className={className} style={style} transition={{layout: {duration: LAYOUT_T}}}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div> }
export function Label(props: Props) { return <Box {...props} /> }
export function Arrow(props: Props) { return <Box {...props} /> }
export function Frame(props: Props) { return <Box {...props} /> }
export function Emphasis(props: Props) { return <Box {...props} /> }
export function SymbolChip(props: Props) { return <Box {...props} /> }
export function Appear({id, className, style, children, icon: Icon, ...rest}: Props) { return <motion.div {...rest} layoutId={id} className={className} style={style} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{delay: ENTER_DELAY, duration: ENTER_T}}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div> }
export function SceneLayer({id, children, className, style, icon: Icon, ...rest}: Props) { return <div {...rest} id={id} data-presentation-layer className={className} style={{position:'absolute', inset:0, ...style}}>{Icon && <Icon aria-hidden="true" />}{children}</div> }
