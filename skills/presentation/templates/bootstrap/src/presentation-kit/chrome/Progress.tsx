export interface ProgressProps {
  titles: string[]
  index: number
  onJump: (index: number) => void
}

/** One button per step; the active one carries `aria-current="step"` and `data-presentation-active`. */
export function Progress({ titles, index, onJump }: ProgressProps) {
  return (
    <div data-presentation-progress="" role="group" aria-label="Steps" style={{ display: 'flex', alignItems: 'center' }}>
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
