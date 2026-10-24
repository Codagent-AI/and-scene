import type { PresentationEntry } from './presentations/index.ts'

export function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations as one evolving diagram.</p>
      <ul data-landing-list="">
        {registry.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`}>{entry.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
