import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL, type AttributionOption } from './attribution'

export function Attribution({ option }: { option?: AttributionOption }) {
  if (option === false) return null
  return (
    <a
      data-presentation-attribution=""
      href={option?.href ?? ATTRIBUTION_HREF}
      target="_blank"
      rel="noreferrer noopener"
      style={{ position: 'absolute', right: 0, bottom: 0 }}
    >
      {option?.label ?? ATTRIBUTION_LABEL}
    </a>
  )
}
