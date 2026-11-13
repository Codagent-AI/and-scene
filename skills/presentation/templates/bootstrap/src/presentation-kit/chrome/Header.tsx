import type { ReactNode } from "react";
export function Header({ title, brand }: { title: string; brand?: ReactNode }) {
  return (
    <header
      data-presentation-header=""
      style={{ position: "absolute", top: 0, left: 0, right: 0 }}
    >
      {brand && <div data-presentation-brand="">{brand}</div>}
      <div data-presentation-title="">{title}</div>
    </header>
  );
}
