export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_LABEL = 'made by and-scene'

export function Attribution() {
  return (
    <a
      data-presentation-attribution=""
      href={ATTRIBUTION_HREF}
      target="_blank"
      rel="noreferrer"
      style={{ position: 'absolute', right: 12, bottom: 8 }}
    >
      {ATTRIBUTION_LABEL}
    </a>
  )
}
