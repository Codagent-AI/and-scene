import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const slug = process.argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(1) }
const directory = `artifacts/presentations/${slug}`
await mkdir(directory, { recursive: true })
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'ignore', detached: true })
let browser
try {
 let ready = false
 for (let i=0;i<100;i++) { try { if ((await fetch('http://127.0.0.1:4174/')).ok) { ready=true; break } } catch {} await new Promise(r=>setTimeout(r,100)) }
 if (!ready) throw Error('preview did not start')
 browser = await chromium.launch({headless:true})
 const page = await browser.newPage({viewport:{width:1440,height:900}})
 await page.goto(`http://127.0.0.1:4174/${slug}`)
 const root = page.locator('[data-presentation]'); await root.waitFor()
 const count = Number(await root.getAttribute('data-step-count'))
 for (let i=0;i<count;i++) {
  await page.waitForTimeout(1000)
  await page.screenshot({path:`${directory}/step-${String(i+1).padStart(2,'0')}.png`})
  const warnings = await page.evaluate(() => {
   const messages = []
   const nodes = [...document.querySelectorAll('body *')].filter(e => { const text = [...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()); const chrome = e.matches('button, a, [data-presentation-node]'); const r=e.getBoundingClientRect(), style=getComputedStyle(e); return (text || chrome) && r.width>0 && r.height>0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity)>0 && !e.closest('[data-presentation-allow-overlap]') })
   for (let a=0;a<nodes.length;a++) for(let b=a+1;b<nodes.length;b++) { const x=nodes[a],y=nodes[b]; if(x.contains(y)||y.contains(x)) continue; const r=x.getBoundingClientRect(),s=y.getBoundingClientRect(); if(r.left<s.right && r.right>s.left && r.top<s.bottom && r.bottom>s.top) messages.push(`overlap: ${x.textContent?.trim()} / ${y.textContent?.trim()}`) }
   for (const selector of ['[data-presentation-progress-item]', '[data-presentation-toc-item]']) { const active=document.querySelector(`${selector}[data-active="true"]`), inactive=document.querySelector(`${selector}[data-active="false"]`); if(active && inactive) { const a=getComputedStyle(active), b=getComputedStyle(inactive); if(a.color===b.color && a.backgroundColor===b.backgroundColor && a.borderColor===b.borderColor && a.transform===b.transform && a.fontWeight===b.fontWeight) messages.push(`indistinct active navigation: ${selector}`) } }
   const attribution=document.querySelector('[data-presentation-attribution]'); if(!attribution) messages.push('missing [data-presentation-attribution]'); else { const style=getComputedStyle(attribution); if(parseFloat(style.fontSize)<12 || (style.color==='rgb(0, 0, 238)' && style.textDecorationLine.includes('underline'))) messages.push('polish [data-presentation-attribution]') }
   return messages
  })
  warnings.forEach(w=>console.warn(`Step ${i+1}: ${w}`))
  if(i+1<count) await page.keyboard.press('ArrowRight')
 }
 console.log(`Captured ${count} steps in ${directory}`)
} catch(e) { console.error(e); process.exitCode=1 }
finally { await browser?.close(); try { process.kill(-server.pid,'SIGTERM') } catch {} }
