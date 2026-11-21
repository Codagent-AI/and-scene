import type { PresentationEntry } from './presentations'

interface LandingProps {
  entries: readonly Pick<PresentationEntry, 'slug' | 'title'>[]
}

export default function Landing({ entries }: LandingProps) {
  return (
    <main>
      <h1>Presentations</h1>
      <ul>
        {entries.map(({ slug, title }) => (
          <li key={slug}><a href={`/${slug}`}>{title}</a></li>
        ))}
      </ul>
    </main>
  )
}
