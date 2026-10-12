import { lazy, StrictMode, Suspense, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { Landing } from "./Landing";
import { presentations } from "./presentations";
import { resolveRoute } from "./presentations/routing";
import "./index.css";

export { resolveRoute } from "./presentations/routing";

const route = resolveRoute(window.location.pathname, presentations);
const App = route
  ? lazy(route.load as () => Promise<{ default: ComponentType }>)
  : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div className="loading">Loading presentation…</div>}>
      {App ? <App /> : <Landing />}
    </Suspense>
  </StrictMode>,
);
