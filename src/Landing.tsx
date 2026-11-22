import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><p>AND SCENE / BROWSER PRESENTATIONS</p><h1>One scene.<br />A story in motion.</h1><p>Follow an idea as it takes shape.</p><ol>{presentations.map(entry => <li key={entry.slug}><a href={`/${entry.slug}`}>{entry.title} <span aria-hidden="true">↗</span></a></li>)}</ol></main>
}
