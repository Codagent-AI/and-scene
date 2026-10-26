import { presentations } from './presentations'
export function Landing() { return <main className="landing"><p>AND SCENE / A FIELD GUIDE</p><h1>Ideas, in motion.</h1><p>One diagram. A story that unfolds.</p><ul>{presentations.map(p => <li key={p.slug}><a href={`/${p.slug}`}><span>{p.title}</span><span aria-hidden="true">↗</span></a></li>)}</ul></main> }
