import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-presentation-landing><h1>Presentations</h1><ul>{presentations.map(item => <li key={item.slug}><a href={`/${encodeURIComponent(item.slug)}`}>{item.title}</a></li>)}</ul>{presentations.length === 0 && <p>No presentations registered yet.</p>}</main>
}
