import { presentations } from './presentations'

export default function Landing() {
  return (
    <main data-landing>
      <h1>Presentations</h1>
      <ul data-landing-list>
        {presentations.map((p) => (
          <li key={p.slug}>
            <a href={`/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
