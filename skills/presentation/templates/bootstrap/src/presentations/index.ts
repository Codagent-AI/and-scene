export const presentations = [{slug:'starter',title:'Starter',load:()=>import('./starter/Talk')}]
export const findPresentation = (path:string) => presentations.find(p=>`/${p.slug}`===path.replace(/\/$/,''))
