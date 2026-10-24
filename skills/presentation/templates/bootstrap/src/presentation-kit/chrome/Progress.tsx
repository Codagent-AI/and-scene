import type { HTMLAttributes } from 'react'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  titles: string[]
  index: number
  onJump: (index: number) => void
}

/** One button per step; the active one carries `aria-current="step"` and `data-presentation-active`. */
export function Progress({ titles, index, onJump, style, ...rest }: ProgressProps) {
  return (
    <div role="group" aria-label="Steps" {...rest} data-presentation-progress="" style={{ display: 'flex', alignItems: 'center', ...style }}>
      {titles.map((title, i) => {
        const active = i === index
        return (
          <button
            key={i}
            type="button"
            data-presentation-progress-item=""
            data-presentation-active={active ? 'true' : undefined}
            aria-current={active ? 'step' : undefined}
            aria-label={`Step ${i + 1}: ${title}`}
            onClick={() => onJump(i)}
          />
        )
      })}
    </div>
  )
}
