import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { preview, browser, stop } from './browser-utils.mjs'
const slug = process.argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('Usage: npm run inspect -- <slug>'); process.exit(1) }
let server, instance
try {
 const p = await preview(); server = p.server; instance = await browser(); const page = await instance.newPage({ viewport: { width: 1440, height: 900 } }); await page.goto(`${p.base}/${slug}`, { waitUntil: 'networkidle' }); const root = page.locator('[data-presentation]'); await root.waitFor({ state: 'attached', timeout: 10000 }); const count = Number(await root.getAttribute('data-step-count')); const dir = path.join('artifacts','presentations',slug); await mkdir(dir,{ recursive: true })
 for (let i=0;i<count;i++) { if (i) await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900); await page.screenshot({ path: path.join(dir,`step-${String(i+1).padStart(2,'0')}.png`) }); const warnings = await page.evaluate(() => {
  const out = []; const visible = e => { const r=e.getBoundingClientRect(), s=getComputedStyle(e); return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none' && Number(s.opacity)>0 }
  const nodes = [...document.querySelectorAll('[data-presentation] p, [data-presentation] h1, [data-presentation] button, [data-presentation] a, [data-presentation-layer] span, [data-presentation-layer] strong, [data-presentation-layer] b, [data-presentation-layer] small')].filter(e=>visible(e) && !e.closest('[data-presentation-allow-overlap]'))
  for (let a=0;a<nodes.length;a++) for(let b=a+1;b<nodes.length;b++) { const x=nodes[a],y=nodes[b]; if(x.contains(y)||y.contains(x)) continue; const r=x.getBoundingClientRect(),s=y.getBoundingClientRect(); if (Math.min(r.right,s.right)-Math.max(r.left,s.left)>2 && Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>2) out.push(`overlap: ${x.textContent.trim()} / ${y.textContent.trim()}`) }
  for (const nav of document.querySelectorAll('[data-presentation-progress], [data-presentation-toc]')) { const active=nav.querySelector('[data-presentation-active="true"]'), inactive=nav.querySelector('[data-presentation-active="false"]'); if(active && inactive) { const a=getComputedStyle(active),b=getComputedStyle(inactive); if(a.color===b.color && a.backgroundColor===b.backgroundColor && a.boxShadow===b.boxShadow && a.textDecorationLine===b.textDecorationLine) out.push(`indistinct active ${nav.hasAttribute('data-presentation-progress') ? 'progress' : 'table of contents'} navigation`) } }
  const link=document.querySelector('[data-presentation-attribution]'); if(!link || !visible(link) || parseFloat(getComputedStyle(link).fontSize)<11 || (getComputedStyle(link).color==='rgb(0, 0, 238)' && getComputedStyle(link).textDecorationLine.includes('underline'))) out.push('unpolished attribution: style [data-presentation-attribution]')
  return out
 }); for (const warning of warnings) console.warn(`Step ${i+1}: ${warning}`); console.log(`Captured ${dir}/step-${String(i+1).padStart(2,'0')}.png`) }
} catch(e) { console.error(e.message); process.exitCode=1 } finally { await stop(server, instance) }
