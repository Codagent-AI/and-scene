import { CHROME } from '../constants'

export interface TocProps {
  eras: readonly string[]
  /** Era of the active step. */
  activeEra: string
  /** Called with the era's first step index. */
  onGoTo: (index: number) => void
}

/** Era-based table of contents: one entry per era, jumping to that era's first step. */
export function Toc({ eras, activeEra, onGoTo }: TocProps) {
  const unique = eras.filter((era, i) => eras.indexOf(era) === i)
  return (
    <nav
      data-presentation-toc
      aria-label="Table of contents"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: CHROME.headerH,
        height: CHROME.tocH,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {unique.map((era) => {
        const active = era === activeEra
        return (
          <button
            key={era}
            type="button"
            data-presentation-toc-entry={era}
            aria-current={active ? 'step' : undefined}
            data-presentation-active={active ? 'true' : undefined}
            onClick={() => onGoTo(eras.indexOf(era))}
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
