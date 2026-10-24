import type { PresentationEntry } from './router'

export function Landing({ entries }: { entries: readonly PresentationEntry[] }) {
  return (
    <main data-landing="">
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

export function NotFound() {
  return (
    <main data-not-found="">
      <h1>Presentation not found</h1>
      <a href="/">Back to all presentations</a>
    </main>
  )
}
