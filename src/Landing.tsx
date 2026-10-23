import type { PresentationEntry } from './presentations/index.ts'

export default function Landing({ entries }: { entries: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>And Scene</h1>
      <p>Presentations that evolve as one scene.</p>
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
