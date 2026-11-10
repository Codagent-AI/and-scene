import { presentations } from './presentations'
export default function Landing() { return <main className="landing"><p>AND SCENE / PRESENTATIONS</p><h1>Ideas, in motion.</h1><p>One diagram. A story that unfolds.</p><ul>{presentations.map(p => <li key={p.slug}><a href={`/${p.slug}`}>{p.title} <span>↗</span></a></li>)}</ul></main> }
