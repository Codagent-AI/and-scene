import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_T, LAYOUT_T } from '../constants'

/**
 * Newcomer entrance. Wrap a *genuinely new* element (one that has no prior
 * layoutId to morph from) in this, and it fades in after a short beat instead of
 * appearing at full strength immediately. The point is sequencing: the pieces
 * already on screen morph to their new positions first and lead the eye, then
 * the new piece arrives — rather than everything happening at once, which reads
 * as confusing. Continuing elements should NOT use this; they morph via layoutId
 * and are the motion the newcomer waits on. Pass a `key` (e.g. the node id) when
 * the same slot hosts a different newcomer each step, so it re-fades each time.
 */
export function Appear({
  children,
  delay,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={delay === undefined ? ENTER_T : { ...ENTER_T, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * One step's diagram layer: absolutely-positioned and self-centered inside the
 * fixed design canvas. Because layers don't share normal flow, mounting one
 * never reflows another — so shared layoutId elements morph between steps
 * without a reflow jump. Defaults can be overridden per step (e.g. a custom
 * exit) by passing the prop through.
 */
export function SceneLayer({ children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={LAYOUT_T}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

type Accent = 'cyan' | 'amber' | 'green' | 'gray'

const ACCENT: Record<Accent, { border: string; text: string; glow: string }> = {
  cyan: { border: 'border-cyan/45', text: 'text-cyan', glow: 'rgba(92,224,216,0.14)' },
  green: { border: 'border-green/45', text: 'text-green', glow: 'rgba(74,222,128,0.14)' },
  amber: { border: 'border-amber/45', text: 'text-amber', glow: 'rgba(240,168,48,0.14)' },
  gray: { border: 'border-gray-400/40', text: 'text-gray-300', glow: 'rgba(148,163,184,0.12)' },
}

export function Box({
  layoutId,
  Icon,
  label,
  subtitle,
  accent = 'gray',
  className = '',
}: {
  layoutId: string
  Icon?: LucideIcon
  label: string
  subtitle?: string
  accent?: Accent
  className?: string
}) {
  const a = ACCENT[accent]
  return (
    <motion.div
      layoutId={layoutId}
      transition={LAYOUT_T}
      className={[
        'relative border-2 bg-bg/70 px-8 py-6 text-center',
        a.border,
        className,
      ].join(' ')}
      style={{ boxShadow: `0 0 28px ${a.glow}` }}
    >
      {Icon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...LAYOUT_T, delay: 0.15 }}
          className={`mb-3 flex justify-center ${a.text}`}
          aria-hidden
        >
          <Icon size={32} strokeWidth={1.4} absoluteStrokeWidth />
        </motion.div>
      )}
      <div className="uppercase tracking-[0.2em] text-gray-100">{label}</div>
      {subtitle && (
        <div className="mt-2 font-sans text-[11px] normal-case leading-relaxed tracking-wide text-gray-300">
          {subtitle}
        </div>
      )}
    </motion.div>
  )
}

export function Label({
  layoutId,
  children,
  className = '',
}: {
  layoutId: string
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={LAYOUT_T}
      className={`text-xs uppercase tracking-[0.2em] text-gray-300 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function Arrow({
  layoutId,
  children,
  className = '',
}: {
  layoutId: string
  children?: ReactNode
  className?: string
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={LAYOUT_T}
      className={`text-cyan ${className}`}
    >
      {children ?? '→'}
    </motion.div>
  )
}

export function Frame({
  layoutId,
  label,
  children,
  className = '',
}: {
  layoutId: string
  label?: string
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={LAYOUT_T}
      className={`relative border-2 border-gray-400/45 bg-bg/50 p-6 ${className}`}
    >
      {label && (
        <span className="absolute -top-3 left-5 bg-bg px-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-200">
          {label}
        </span>
      )}
      {children}
    </motion.div>
  )
}

export function Emphasis({
  layoutId,
  children,
  accent = 'cyan',
  className = '',
}: {
  layoutId: string
  children: ReactNode
  accent?: Accent
  className?: string
}) {
  const a = ACCENT[accent]
  return (
    <motion.div
      layoutId={layoutId}
      transition={LAYOUT_T}
      className={`border ${a.border} bg-bg/60 px-4 py-2 ${a.text} ${className}`}
      style={{ boxShadow: `0 0 20px ${a.glow}` }}
    >
      {children}
    </motion.div>
  )
}

export function SymbolChip({
  layoutId,
  Icon,
  label,
  subtitle,
  accent = 'cyan',
  variant,
}: {
  layoutId: string
  Icon: LucideIcon
  label: string
  subtitle?: string
  accent?: Accent
  variant: 'symbol' | 'chip'
}) {
  const a = ACCENT[accent]
  const isSymbol = variant === 'symbol'

  return (
    <motion.div
      layoutId={layoutId}
      transition={LAYOUT_T}
      className={[
        'relative flex items-center border-2 bg-bg/70',
        a.border,
        isSymbol ? 'flex-col gap-3 px-9 py-7' : 'flex-row gap-2.5 px-4 py-2.5',
      ].join(' ')}
      style={{ boxShadow: `0 0 28px ${a.glow}` }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...LAYOUT_T, delay: isSymbol ? 0.22 : 0.06 }}
        className={a.text}
        aria-hidden
      >
        <Icon size={isSymbol ? 46 : 18} strokeWidth={1.4} absoluteStrokeWidth />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...LAYOUT_T, delay: isSymbol ? 0.3 : 0.1 }}
        className={isSymbol ? 'text-center' : ''}
      >
        <div
          className={[
            'uppercase tracking-[0.2em] text-gray-100',
            isSymbol ? 'text-lg' : 'text-xs',
          ].join(' ')}
        >
          {label}
        </div>
        {isSymbol && subtitle && (
          <div className="mt-1.5 max-w-[13rem] font-sans text-[11px] normal-case leading-relaxed tracking-wide text-gray-300">
            {subtitle}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
