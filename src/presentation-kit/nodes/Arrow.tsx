import type { CSSProperties } from 'react'
export function Arrow({ className, style, label, from, to }: { className?: string; style?: CSSProperties; label?: string; from?: string; to?: string }) { return <div className={className} style={style} role="img" aria-label={label ?? 'arrow'} data-presentation-node="arrow" data-from={from} data-to={to}>→</div> }
