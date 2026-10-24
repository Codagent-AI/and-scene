import type { RegistryEntry } from './router.ts'

export default function Landing({ registry }: { registry: readonly RegistryEntry[] }) {
  return (
    <main>
      <h1>and-scene</h1>
      <p>Presentations built as one evolving scene.</p>
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
