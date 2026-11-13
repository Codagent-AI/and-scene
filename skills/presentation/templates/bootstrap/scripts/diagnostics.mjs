export function overlaps(a,b) {return Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1}
export function diagnostics(state,index) {
 const warnings=[]
 const items=[...state.texts,...(state.surfaces??[])]
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++) {
  const a=items[i],b=items[j]
  if(a.owner!==undefined&&a.owner===b.owner)continue
  if(!a.allowed&&!b.allowed&&overlaps(a.rect,b.rect))warnings.push(`step ${index}: overlap: ${a.label} ↔ ${b.label}`)
 }
 for(const item of state.chrome)if(JSON.stringify(item.active)===JSON.stringify(item.inactive))warnings.push(`step ${index}: indistinct active ${item.name}; style [data-active="true"]`)
 const link=state.attribution?.style
 if(!link || parseFloat(link.fontSize)<11 || (['rgb(0, 0, 238)','rgb(85, 26, 139)'].includes(link.color)&&link.textDecorationLine.includes('underline')))warnings.push(`step ${index}: unpolished attribution; style [data-presentation-attribution]`)
 return warnings
}
// This function is serialized by Playwright; it deliberately has no module dependencies.
export function collectVisualState() {
 const visible=element=>{
  const rect=element.getBoundingClientRect()
  if(rect.width<=0||rect.height<=0||rect.right<=0||rect.bottom<=0||rect.left>=innerWidth||rect.top>=innerHeight)return false
  for(let ancestor=element;ancestor;ancestor=ancestor.parentElement) {
   const style=getComputedStyle(ancestor)
   if(style.visibility==='hidden'||style.display==='none'||Number(style.opacity)===0)return false
  }
  return true
 }
 const styleOf=element=>{
  const style=getComputedStyle(element)
  return Object.fromEntries(['color','backgroundColor','fontSize','fontWeight','borderTopColor','borderLeftColor','borderTopWidth','borderLeftWidth','boxShadow','opacity','textDecorationLine'].map(key=>[key,style[key]]))
 }
 const texts=[]
 const root=document.querySelector('[data-presentation-root]')
 const controls=[...root.querySelectorAll('[data-presentation-header] button, [data-presentation-header] a, [data-presentation-footer] button, [data-presentation-footer] a, [data-presentation-toc] button, [data-presentation-toc] a, [data-presentation-attribution]')]
 const owner=element=>controls.findIndex(control=>control===element||control.contains(element))
 const surfaces=controls.filter(visible).map(element=>{
  const rect=element.getBoundingClientRect()
  return {label:`chrome: ${element.getAttribute('aria-label')??element.textContent.trim()}`,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},owner:owner(element),allowed:!!element.closest('[data-presentation-allow-overlap]')}
 })
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
 while(walker.nextNode()) {
  const node=walker.currentNode,element=node.parentElement
  if(!node.textContent.trim()||!visible(element)||element.closest('svg,script,style'))continue
  if(element.closest('[data-presentation-scene][data-active="false"]'))continue
  const range=document.createRange();range.selectNodeContents(node)
  const rect=range.getBoundingClientRect()
  if(rect.width&&rect.height)texts.push({label:`${element.closest('[data-presentation-entity]')?.getAttribute('data-presentation-entity')??element.tagName}: ${node.textContent.trim().slice(0,55)}`,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},owner:owner(element)<0?undefined:owner(element),allowed:!!element.closest('[data-presentation-allow-overlap]')})
 }
 const chrome=[]
 for(const [name,selector] of [['progress','[data-presentation-progress]'],['toc','[data-presentation-toc]']]) {
  const active=document.querySelector(`${selector} [data-active="true"]`),inactive=document.querySelector(`${selector} [data-active="false"]`)
  if(active&&inactive&&visible(active)&&visible(inactive))chrome.push({name,active:styleOf(active),inactive:styleOf(inactive)})
 }
 const attribution=document.querySelector('[data-presentation-attribution]')
 return {texts,surfaces,chrome,attribution:attribution&&visible(attribution)?{style:styleOf(attribution)}:null}
}
