import { presentations } from './presentations'
export default function Landing() { return <main><h1>Presentations</h1><ul>{presentations.map((entry) => <li key={entry.slug}><a href={`/${entry.slug}`}>{entry.title}</a></li>)}</ul></main> }
