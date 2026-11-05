import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
type Props = { id: string; children?: ReactNode; className?: string; style?: CSSProperties; Icon?: LucideIcon }
function Node({ id, children, className, style, Icon, kind }: Props & { kind: string }) { return <motion.div layoutId={id} data-presentation-node={kind} className={className} style={style} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: { duration: LAYOUT_T }, opacity: { delay: ENTER_DELAY, duration: ENTER_T } }}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div> }
export function Box(p: Props) { return <Node {...p} kind="box" /> }
export function Label(p: Props) { return <Node {...p} kind="label" /> }
export function Arrow(p: Props) { return <Node {...p} kind="arrow" /> }
export function Frame(p: Props) { return <Node {...p} kind="frame" /> }
export function Emphasis(p: Props) { return <Node {...p} kind="emphasis" /> }
export function SymbolChip(p: Props) { return <Node {...p} kind="symbol-chip" /> }
export function Appear({ children }: { children: ReactNode }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: ENTER_DELAY, duration: ENTER_T }}>{children}</motion.div> }
export function SceneLayer({ children }: { children: ReactNode }) { return <div data-presentation-scene-layer style={{ position: 'absolute', inset: 0 }}>{children}</div> }
