import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><p>AND SCENE / A COLLECTION OF EVOLVING IDEAS</p><h1>A story that<br />stays with you.</h1><p>One canvas. New connections. Explore a presentation.</p><ol>{presentations.map(p => <li key={p.slug}><a href={`/${p.slug}`}>{p.title} <span aria-hidden="true">↗</span></a></li>)}</ol><a href="https://github.com/Codagent-AI/and-scene">and-scene on GitHub</a></main>
}
