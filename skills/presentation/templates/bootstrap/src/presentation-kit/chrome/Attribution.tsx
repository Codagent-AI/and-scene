export const ATTRIBUTION_URL = 'https://github.com/and-scene/and-scene'

/**
 * Default bottom-right toolkit disclosure. Not a presentation style system —
 * exposes a stable hook so presentation CSS can make it legible.
 */
export function Attribution() {
  return (
    <a
      className="sk-attribution"
      data-scene-kit="attribution"
      href={ATTRIBUTION_URL}
      target="_blank"
      rel="noreferrer"
    >
      made by and-scene
    </a>
  )
}
