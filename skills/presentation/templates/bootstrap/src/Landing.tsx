import type { PresentationEntry } from './presentations/index.ts'

export function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main data-landing="">
      <h1>Presentations</h1>
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
