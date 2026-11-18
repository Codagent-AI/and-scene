import { lazy, Suspense } from "react";
import Landing from "./Landing";
import { findPresentation } from "./presentations";
const entry = findPresentation(window.location.pathname);
const Talk = entry ? lazy(entry.load) : null;
export function Router() {
  return Talk ? (
    <Suspense fallback={<p>Loading presentation…</p>}>
      <Talk />
    </Suspense>
  ) : (
    <Landing />
  );
}
