import { presentations } from './presentations'

export default function Landing() {
  return <main data-presentation-landing="">
    <h1>Presentations</h1>
    {presentations.length === 0 ? <p>No presentations yet.</p> : <ul>{presentations.map(({ slug, title }) => <li key={slug}><a href={`/${slug}`}>{title}</a></li>)}</ul>}
  </main>
}
