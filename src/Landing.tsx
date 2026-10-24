import type { PresentationEntry } from './presentations/registry'

export default function Landing({ presentations }: { presentations: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations that are one evolving diagram.</p>
      <ul>
        {presentations.map((p) => (
          <li key={p.slug}>
            <a data-landing-link={p.slug} href={`/${p.slug}`}>
              {p.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
