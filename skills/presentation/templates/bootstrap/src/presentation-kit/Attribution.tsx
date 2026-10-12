import type { ReactNode } from "react";
export type AttributionOptions =
  | false
  | { label?: string; href?: string; render?: () => ReactNode };
export function Attribution({
  options = {},
}: {
  options?: AttributionOptions;
}) {
  if (options === false) return null;
  if (options.render)
    return <div data-presentation-attribution>{options.render()}</div>;
  return (
    <a
      data-presentation-attribution
      href={options.href ?? "https://github.com/Codagent-AI/and-scene"}
      style={{ position: "absolute", right: 0, bottom: 0 }}
    >
      {options.label ?? "made by and-scene"}
    </a>
  );
}
