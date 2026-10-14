import type { PresentationEntry } from './presentations'

export function Landing({ presentations }: { presentations: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>And Scene</h1>
      {presentations.length === 0 ? (
        <p>No presentations yet.</p>
      ) : (
        <ul>
          {presentations.map((p) => (
            <li key={p.slug}>
              <a href={`/${p.slug}`}>{p.title}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
