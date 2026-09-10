import { presentations } from './presentations'

export default function Landing() {
  return <main data-presentation-landing><h1>Presentations</h1>{presentations.length === 0 ? <p data-presentation-empty>No presentations are registered yet.</p> : <nav aria-label="Presentations"><ul>{presentations.map((presentation) => <li key={presentation.slug}><a href={`/${presentation.slug}`}>{presentation.title}</a></li>)}</ul></nav>}</main>
}
