import { PRESENTATIONS } from './presentations/index.ts'

export default function Landing() {
  return (
    <main className="landing">
      <h1>Presentations</h1>
      <ul>
        {PRESENTATIONS.map((p) => (
          <li key={p.slug}>
            <a href={`/${p.slug}`} data-presentation-link={p.slug}>
              {p.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
