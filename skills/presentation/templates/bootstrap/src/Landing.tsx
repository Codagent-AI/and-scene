import type { PresentationEntry } from './presentations/types'

export function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations as one evolving diagram.</p>
      <ul>
        {registry.map(({ slug, title }) => (
          <li key={slug}>
            <a href={`/${slug}`}>{title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
