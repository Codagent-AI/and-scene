import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const slug = process.argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('Usage: npm run inspect -- <slug>'); process.exit(1) }
let server, browser
try {
  server = spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4174','--strictPort'],{stdio:'ignore', detached:true})
  let ready = false
  for(let i=0;i<100;i++) { try { if((await fetch('http://127.0.0.1:4174/')).ok) { ready=true; break } } catch {} await new Promise(r=>setTimeout(r,100)) }
  if(!ready) throw new Error('preview failed to start')
  browser = await chromium.launch(); const page = await browser.newPage({viewport:{width:1440,height:900}})
  await page.goto(`http://127.0.0.1:4174/${slug}`); const root = page.locator('[data-presentation-root]'); await root.waitFor({timeout:5000})
  const count = Number(await root.getAttribute('data-step-count')); const dir = `artifacts/inspection/${slug}`; await mkdir(dir,{recursive:true})
  for(let i=0;i<count;i++) {
    await page.waitForTimeout(1000)
    const warnings = await page.evaluate(() => {
      const alerts = []; const nodes = [...document.querySelectorAll('[data-presentation-root] *')].filter(e => { const s=getComputedStyle(e); const r=e.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity)>0 && r.width>0 && r.height>0 && (e.children.length===0 && e.textContent?.trim()) && !e.closest('[data-presentation-allow-overlap]') })
      for(let a=0;a<nodes.length;a++) for(let b=a+1;b<nodes.length;b++) { const x=nodes[a].getBoundingClientRect(), y=nodes[b].getBoundingClientRect(); if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>2 && Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>2) alerts.push(`overlap: ${nodes[a].textContent?.trim()} / ${nodes[b].textContent?.trim()}`) }
      const attribution=document.querySelector('[data-presentation-attribution]'); if(!attribution || parseFloat(getComputedStyle(attribution).fontSize)<12 || getComputedStyle(attribution).color==='rgb(0, 0, 238)') alerts.push('attribution: style [data-presentation-attribution]')
      for(const [name, group] of [['progress',document.querySelector('[data-presentation-navigation]')],['table of contents',document.querySelector('[data-presentation-toc]')]]) { const active=group?.querySelector('[data-presentation-active="true"]'), inactive=group?.querySelector('[data-presentation-active="false"]'); if(active && inactive && getComputedStyle(active).color===getComputedStyle(inactive).color && getComputedStyle(active).backgroundColor===getComputedStyle(inactive).backgroundColor && getComputedStyle(active).fontWeight===getComputedStyle(inactive).fontWeight) alerts.push(`active ${name} appears indistinct`) }
      return alerts
    })
    warnings.forEach(w=>console.warn(`Step ${i+1}: ${w}`)); await page.screenshot({path:`${dir}/step-${String(i+1).padStart(2,'0')}.png`})
    if(i<count-1) await page.keyboard.press('ArrowRight')
  }
  console.log(`Screenshots: ${dir}`)
} catch(error) { console.error(error.message); process.exitCode=1 } finally { if(browser) await browser.close(); if(server) process.kill(-server.pid, 'SIGTERM') }
