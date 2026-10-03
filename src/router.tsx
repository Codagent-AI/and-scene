import type { AnchorHTMLAttributes, ReactNode } from 'react'

export function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return <a href={href} {...props}>{children}</a>
}
