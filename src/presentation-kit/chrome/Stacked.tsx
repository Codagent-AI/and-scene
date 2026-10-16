interface StackedProps {
  texts: readonly string[]
  active: number
  /** Hook attribute (e.g. `data-presentation-title`) carried by the active text only. */
  hook: string
  as?: 'h1' | 'p'
}

/**
 * Lays every step's text in one grid cell and shows only the active one, so the
 * chrome keeps the height of the tallest text and the stage scale stays constant
 * while navigating within a mode.
 */
export function Stacked({ texts, active, hook, as: Tag = 'p' }: StackedProps) {
  return (
    <div data-presentation-stack="" style={{ display: 'grid' }}>
      {texts.map((text, i) =>
        i === active ? (
          <Tag key={i} {...{ [hook]: '' }} style={{ gridArea: '1 / 1' }}>
            {text}
          </Tag>
        ) : (
          <Tag key={i} aria-hidden="true" style={{ gridArea: '1 / 1', visibility: 'hidden' }}>
            {text}
          </Tag>
        ),
      )}
    </div>
  )
}
