import { presentations } from './presentations'
export default function Landing() { return <main data-presentation-landing><h1>And Scene</h1><p>Presentations as evolving diagrams.</p><ul>{presentations.map(item => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul></main> }
