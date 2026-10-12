import type { HTMLAttributes, ReactNode } from 'react'
export function SceneLayer(props: HTMLAttributes<HTMLDivElement> & {children?:ReactNode}) { return <div data-presentation-node="scene-layer" {...props} style={{position:'absolute',inset:0,...props.style}}/> }
