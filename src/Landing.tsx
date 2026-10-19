import type { PresentationEntry } from './presentations'

export function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <ul>
        {registry.map((e) => (
          <li key={e.slug}>
            <a href={`/${e.slug}`}>{e.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
