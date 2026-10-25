import { presentations } from './presentations/index.ts'
import type { PresentationEntry } from './presentations/types.ts'

export function Landing({ registry = presentations }: { registry?: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <ul>
        {registry.map((p) => (
          <li key={p.slug}>
            <a href={`/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}

export function NotFound({ path }: { path: string }) {
  return (
    <main className="landing">
      <h1>Not found</h1>
      <p>No presentation is registered at {path}.</p>
      <a href="/">Back to all presentations</a>
    </main>
  )
}
