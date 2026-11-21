import type { PresentationEntry } from './presentations'

interface LandingProps {
  entries: readonly Pick<PresentationEntry, 'slug' | 'title'>[]
}

export default function Landing({ entries }: LandingProps) {
  return (
    <main className="landing">
      <header className="landing-header">
        <span className="landing-symbol" aria-hidden="true">✳</span>
        <span>and-scene</span>
      </header>
      <section className="landing-index" aria-labelledby="presentation-index">
        <h1 id="presentation-index">Presentations</h1>
        <ul>
          {entries.map(({ slug, title }) => (
            <li key={slug}>
              <a href={`/${slug}`}>
                <span>{title}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
