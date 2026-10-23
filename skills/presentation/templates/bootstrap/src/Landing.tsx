import type { PresentationEntry } from './presentations/index.ts'

export default function Landing({ entries }: { entries: readonly PresentationEntry[] }) {
  return (
    <main className="landing" data-landing="">
      <h1>and-scene</h1>
      <ul>
        {entries.map((e) => (
          <li key={e.slug}>
            <a data-presentation-link={e.slug} href={`/${e.slug}`}>
              {e.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
