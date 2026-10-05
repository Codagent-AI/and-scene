import { presentations } from './presentations'

export default function Landing() {
  return <main data-presentation-landing="">
    <h1>And Scene</h1>
    <p>Browser presentations built as evolving scenes.</p>
    <nav aria-label="Presentations">
      {presentations.length === 0 ? <p data-presentation-empty="">No presentations yet.</p> : <ul>{presentations.map(({ slug, title }) => <li key={slug}><a href={`/${encodeURIComponent(slug)}`}>{title}</a></li>)}</ul>}
    </nav>
  </main>
}
