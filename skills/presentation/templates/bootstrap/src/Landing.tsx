import type { RegistryEntry } from './router'

export function Landing({ registry }: { registry: readonly RegistryEntry[] }) {
  return (
    <main data-landing="">
      <h1>Presentations</h1>
      {registry.length === 0 ? (
        <p>No presentations are registered yet.</p>
      ) : (
        <ul>
          {registry.map((entry) => (
            <li key={entry.slug}>
              <a href={`/${entry.slug}`}>{entry.title}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
