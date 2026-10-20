import type { PresentationEntry } from './presentations/index.ts'

export function Landing({ presentations }: { presentations: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>And Scene</h1>
      <p>Presentations as one evolving diagram.</p>
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
