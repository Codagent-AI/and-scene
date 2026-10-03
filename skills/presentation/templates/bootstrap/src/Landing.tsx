import { presentations } from './presentations/index.ts'

export default function Landing() {
  return <main className="presentation-index">
    <h1>Presentations</h1>
    {presentations.length ? <ul>{presentations.map(item => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul> : <p>No presentations yet.</p>}
  </main>
}
