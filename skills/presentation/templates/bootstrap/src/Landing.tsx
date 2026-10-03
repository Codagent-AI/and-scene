import { presentations } from './presentations'

export default function Landing() {
  return <main data-presentation-landing="">
    <h1>Presentations</h1>
    <ul>{presentations.map(({ slug, title }) => <li key={slug}><a href={`/${slug}`} data-presentation-link="">{title}</a></li>)}</ul>
  </main>
}
