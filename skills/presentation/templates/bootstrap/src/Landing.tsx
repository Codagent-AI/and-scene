import { presentations } from './presentations'
export default function Landing() {
  return <main data-presentation-landing style={{ maxWidth: 880, margin: '12vh auto', padding: 24 }}><p>and-scene</p><h1>Presentations as evolving scenes</h1><p>Each presentation follows one diagram as its ideas develop.</p><ul>{presentations.map(({ slug, title }) => <li key={slug}><a href={`/${slug}`}>{title}</a></li>)}</ul></main>
}
