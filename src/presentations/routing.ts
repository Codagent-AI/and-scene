import type { PresentationEntry } from "./index";

export function resolveRoute(pathname: string, registry: readonly PresentationEntry[]): PresentationEntry | null {
  if (pathname === "/") return null;
  const slug = pathname.replace(/^\//, "").replace(/\/$/, "");
  return registry.find((entry) => entry.slug === slug) ?? null;
}
