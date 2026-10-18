import type { PresentationEntry } from './presentations/types'

export function Landing({ presentations }: { presentations: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <ul>
        {presentations.map((p) => (
          <li key={p.slug}>
            <a href={`/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
