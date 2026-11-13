import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { resolvePresentation } from "./presentations";
import { Landing } from "./Landing";
import "./index.css";
const entry = resolvePresentation(window.location.pathname);
const Talk = entry ? lazy(entry.load) : null;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<p>Loading presentation…</p>}>
      {Talk ? <Talk /> : <Landing />}
    </Suspense>
  </StrictMode>,
);
