import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><p>AND SCENE</p><h1>Ideas in motion.</h1><p>One diagram. A story that unfolds.</p><ul>{presentations.map(entry => <li key={entry.slug}><a href={`/${entry.slug}`}>{entry.title} <span aria-hidden="true">↗</span></a></li>)}</ul></main>
}
