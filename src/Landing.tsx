import { presentations } from './presentations'
export default function Landing() { return <main className="landing"><p>AND SCENE / PRESENTATION INDEX</p><h1>One scene, changing state.</h1><p>Browser presentations built as evolving diagrams.</p><ul>{presentations.map((p) => <li key={p.slug}><a href={`/${p.slug}`}>{p.title}<span>Explore →</span></a></li>)}</ul></main> }
