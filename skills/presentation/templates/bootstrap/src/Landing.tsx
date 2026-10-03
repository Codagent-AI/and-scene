import { presentations } from './presentations'
export default function Landing() { return <main data-presentation-landing><h1>Presentations as evolving scenes.</h1>{presentations.map((item) => <a key={item.slug} href={`/${item.slug}`}>{item.title}</a>)}</main> }
