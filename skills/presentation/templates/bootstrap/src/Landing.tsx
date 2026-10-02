import { presentations } from './presentations'

export default function Landing() {
  return <main data-presentation-landing><h1>Presentations</h1><nav aria-label="Presentations">{presentations.map(({ slug, title }) => <p key={slug}><a href={`/${slug}`}>{title}</a></p>)}</nav></main>
}
