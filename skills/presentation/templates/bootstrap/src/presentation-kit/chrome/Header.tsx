import type { ReactNode } from 'react'
export function Header({title,brand}:{title:string;brand?:ReactNode}) {return <header data-presentation-header=""><div data-presentation-brand="">{brand}</div><div data-presentation-title="">{title}</div></header>}
