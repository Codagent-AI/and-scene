import { Suspense, lazy } from 'react';
import Landing from './Landing';
import { presentations } from './presentations';
const routes = presentations.map(entry => ({ pathname: `/${entry.slug}`, Component: lazy(entry.load) }));
export function PresentationRoute({ pathname }: {
    pathname: string;
}) {
    const Route = routes.find(route => route.pathname === pathname)?.Component ?? Landing;
    return <Suspense fallback={<p>Loading presentation…</p>}><Route /></Suspense>;
}
