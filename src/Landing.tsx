import type { PresentationEntry } from './presentations'

export default function Landing({ entries }: { entries: readonly PresentationEntry[] }) {
  return (
    <main data-presentation-landing="">
      <h1>And Scene</h1>
      <ul>
        {entries.map(({ slug, title }) => (
          <li key={slug}><a data-presentation-route={slug} href={`/${slug}`}>{title}</a></li>
        ))}
      </ul>
    </main>
  )
}
