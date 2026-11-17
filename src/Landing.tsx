import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><p>AND SCENE / PRESENTATIONS</p><h1>Ideas take shape.</h1><p>One evolving scene. A story you can step through.</p><ul>{presentations.map(p => <li key={p.slug}><a href={`/${p.slug}`}>{p.title} ↗</a></li>)}</ul></main>
}
