import type { PresentationEntry } from './presentations'

export default function Landing({ presentations }: { presentations: ReadonlyArray<PresentationEntry> }) {
  return (
    <main data-landing="">
      <h1>Presentations</h1>
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
