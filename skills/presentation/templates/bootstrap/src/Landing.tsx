import { PRESENTATIONS } from './presentations'

export default function Landing() {
  return <main>
    <h1>Presentations</h1>
    {PRESENTATIONS.length ? <ul>{PRESENTATIONS.map(({ slug, title }) => <li key={slug}><a href={`/${slug}`}>{title}</a></li>)}</ul> : <p>No presentations yet.</p>}
  </main>
}
