import type { PresentationEntry } from './presentations/index.ts'

export default function Landing({ presentations }: { presentations: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <p className="landing-eyebrow">and-scene</p>
      <h1>Presentations as evolving diagrams</h1>
      <ul className="landing-list" aria-label="Presentations">
        {presentations.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`} data-presentation-link={entry.slug}>
              {entry.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
