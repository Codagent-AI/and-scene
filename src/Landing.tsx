import type { PresentationEntry } from './presentations/types'

export function Landing({ entries }: { entries: readonly PresentationEntry[] }) {
  return (
    <main>
      <h1>and-scene</h1>
      <ul>
        {entries.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`}>{entry.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
