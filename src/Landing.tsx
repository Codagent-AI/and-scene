import type { PresentationEntry } from './presentations'

export function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main className="landing" data-landing="">
      <h1>and-scene</h1>
      <p>Presentations that behave like one evolving diagram.</p>
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
