import type { PresentationEntry } from './presentations/registry.ts'

export function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations that evolve as one scene.</p>
      <ul>
        {registry.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`}>{entry.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
