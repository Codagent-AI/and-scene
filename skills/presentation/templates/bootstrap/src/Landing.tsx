import { presentations } from './presentations'
export default function Landing() {
  return <main><h1>Presentations</h1><ul>{presentations.map(p => <li key={p.slug}><a href={`/${p.slug}`}>{p.title}</a></li>)}</ul></main>
}
