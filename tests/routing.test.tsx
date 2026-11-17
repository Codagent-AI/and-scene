// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
const state=vi.hoisted(()=>({ render: vi.fn() }))
vi.mock('react-dom/client',()=>({createRoot:()=>({render:state.render})}))
it('routes a registered slug to its lazy entry and unknown paths to landing', async()=>{ document.body.innerHTML='<div id="root"></div>'; window.history.pushState({},'', '/how-to-make-a-presentation'); await import('../src/main'); let tree=state.render.mock.calls.at(-1)![0]; expect(typeof tree.props.children.props.children.type._init).toBe('function'); vi.resetModules(); window.history.pushState({},'','/unknown'); await import('../src/main'); tree=state.render.mock.calls.at(-1)![0]; expect(tree.props.children.props.children.type.name).toBe('Landing') })
