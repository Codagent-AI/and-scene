import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from '../presentations'

const routes = presentations.map((entry) => ({
  ...entry,
  Page: lazy(entry.load),
}))

export function Router({
  pathname = window.location.pathname,
}: {
  pathname?: string
}) {
  const entry = routes.find(
    (item) => `/${item.slug}` === pathname.replace(/\/$/, ''),
  )
  if (!entry) return <Landing />
  const Page = entry.Page
  return (
    <Suspense fallback={<p role="status">Loading presentation…</p>}>
      <Page />
    </Suspense>
  )
}
