import type { PresentationEntry } from './presentations/index.ts'

export default function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main data-landing="">
      <h1>and-scene</h1>
      <ul>
        {registry.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`} data-presentation-slug={entry.slug}>
              {entry.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
