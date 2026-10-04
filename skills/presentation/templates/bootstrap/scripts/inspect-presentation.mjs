import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const host='127.0.0.1', port=4179, base=`http://${host}:${port}`, out=`artifacts/inspection/${slug}`
await mkdir(out,{recursive:true})
const server=spawn('npm',['run','preview','--','--host',host,'--port',String(port),'--strictPort'],{stdio:'ignore'})
let browser
try {
  let ready=false
  for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{} await delay(250);if(server.exitCode!==null)throw Error('preview exited before becoming ready')}
  if(!ready)throw Error('preview did not become ready')
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:960}})
  await page.goto(`${base}/${encodeURIComponent(slug)}`,{waitUntil:'networkidle'})
  const root=page.locator('[data-presentation]');if(!(await root.count()))throw Error(`No presentation route found for ${slug}`)
  const count=Number(await root.getAttribute('data-step-count'))
  for(let i=0;i<count;i++){
    if(Number(await root.getAttribute('data-step-index'))!==i)await page.locator('[data-presentation-progress-item]').nth(i).click()
    await page.waitForTimeout(900);await page.screenshot({path:`${out}/step-${String(i+1).padStart(2,'0')}.png`})
    const warnings=await page.evaluate(()=>{
      const selectors='[data-presentation-caption], [data-presentation-header], [data-presentation-toc], [data-presentation-progress], [data-presentation-controls], [data-presentation-attribution], [data-presentation-node]'
      const els=[...document.querySelectorAll(selectors)].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden')
      const overlaps=(a,b)=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top}
      const result=[]
      for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i],b=els[j];if(a.closest('[data-presentation-allow-overlap]')||b.closest('[data-presentation-allow-overlap]'))continue;if(overlaps(a,b)&&(a.innerText?.trim()||b.innerText?.trim()))result.push(`possible overlap: ${a.getAttribute('data-presentation-node')||a.className} / ${b.getAttribute('data-presentation-node')||b.className}`)}
      const active=document.querySelector('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="location"]'), inactive=document.querySelector('[data-presentation-progress-item]:not([aria-current]), [data-presentation-toc-item]:not([aria-current])')
      if(active&&inactive){const a=getComputedStyle(active),b=getComputedStyle(inactive);if(a.color===b.color&&a.backgroundColor===b.backgroundColor&&a.fontWeight===b.fontWeight&&a.outlineStyle==='none')result.push('active navigation may be visually indistinct')}
      const attribution=document.querySelector('[data-presentation-attribution]');if(!attribution)result.push('missing attribution; style [data-presentation-attribution]');else{const s=getComputedStyle(attribution);if(parseFloat(s.fontSize)<11||(s.color==='rgb(0, 0, 238)'&&s.textDecorationLine.includes('underline')))result.push('attribution may be browser-default or undersized; style [data-presentation-attribution]')}
      return result
    })
    for(const warning of warnings)console.warn(`WARNING step ${i+1}: ${warning}`)
  }
  console.log(`Captured ${count} settled step screenshots in ${out}`)
} finally {await browser?.close();if(server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve))}}
