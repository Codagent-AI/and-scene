import { presentations } from './presentations/index'
import './Landing.css'
export default function Landing() { return <main className="presentation-landing"><h1>Presentations</h1>{presentations.length ? <ul>{presentations.map((item) => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul> : <p>No presentations have been registered yet.</p>}</main> }
