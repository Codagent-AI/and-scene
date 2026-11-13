import { lazy, Suspense } from 'react'
import { presentations } from './presentations'
import { Landing } from './Landing'
const routes=presentations.map(entry=>({...entry,Page:lazy(entry.load)}))
export function Router({pathname=window.location.pathname}:{pathname?:string}) {
 const Page=routes.find(p=>`/${p.slug}`===pathname.replace(/\/$/,''))?.Page??Landing
 return <Suspense fallback={<p>Loading presentation…</p>}><Page/></Suspense>
}
