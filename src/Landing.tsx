import type { PresentationEntry } from './presentations'

export default function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations as one evolving diagram.</p>
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
