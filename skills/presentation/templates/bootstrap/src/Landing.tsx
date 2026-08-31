import { presentations } from './presentations'

export function Landing() {
  return <main data-presentation-landing><h1>Presentations</h1>{presentations.length ? <nav aria-label="Presentations"><ul>{presentations.map((presentation) => <li key={presentation.slug}><a href={`/${presentation.slug}`}>{presentation.title}</a></li>)}</ul></nav> : <p>No presentations have been registered yet.</p>}</main>
}
