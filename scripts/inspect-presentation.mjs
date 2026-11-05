import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const slug = process.argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('Usage: npm run inspect -- <slug>'); process.exit(1) }
let server, browser
try {
  server = spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4174','--strictPort'],{stdio:'ignore', detached:true})
  await new Promise(r => setTimeout(r, 500))
  if (server.exitCode !== null) throw new Error('preview failed to start')
  let ready = false
  for(let i=0;i<100;i++) { try { if((await fetch('http://127.0.0.1:4174/')).ok) { ready=true; break } } catch {} await new Promise(r=>setTimeout(r,100)) }
  if(!ready) throw new Error('preview failed to start')
  browser = await chromium.launch(); const page = await browser.newPage({viewport:{width:1440,height:900}})
  await page.goto(`http://127.0.0.1:4174/${slug}`); const root = page.locator('[data-presentation-root]'); await root.waitFor({timeout:5000})
  const count = Number(await root.getAttribute('data-step-count')); const dir = `artifacts/inspection/${slug}`; await mkdir(dir,{recursive:true})
  if (await root.getAttribute('data-presentation-mode') === 'present') await page.locator('[data-presentation-mode-toggle]').click()
  for(let i=0;i<count;i++) {
    if (i > 0) await page.locator('[data-presentation-navigation] button').nth(i + 1).click()
    await page.waitForFunction(index => Number(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')) === index, i)
    await page.waitForTimeout(1000)
    const warnings = await page.evaluate(() => {
      const alerts = []; const nodes = []
      const walker = document.createTreeWalker(document.querySelector('[data-presentation-root]'), NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const text = walker.currentNode; const element = text.parentElement; const label = text.textContent?.trim()
        if (!label || !element || element.closest('[data-presentation-allow-overlap]')) continue
        const style = getComputedStyle(element); if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue
        const range = document.createRange(); range.selectNodeContents(text)
        for (const rect of range.getClientRects()) if (rect.width > 0 && rect.height > 0) nodes.push({rect, label, element})
      }
      for(let a=0;a<nodes.length;a++) for(let b=a+1;b<nodes.length;b++) { const x=nodes[a].rect, y=nodes[b].rect; if(nodes[a].element === nodes[b].element) continue; if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>2 && Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>2) alerts.push(`overlap: ${nodes[a].label} / ${nodes[b].label}`) }
      const attribution=document.querySelector('[data-presentation-attribution]'); if(!attribution || parseFloat(getComputedStyle(attribution).fontSize)<12 || getComputedStyle(attribution).color==='rgb(0, 0, 238)') alerts.push('attribution: style [data-presentation-attribution]')
      for(const [name, group] of [['progress',document.querySelector('[data-presentation-navigation]')],['table of contents',document.querySelector('[data-presentation-toc]')]]) { const active=group?.querySelector('[data-presentation-active="true"]'), inactive=group?.querySelector('[data-presentation-active="false"]'); if(active && inactive && getComputedStyle(active).color===getComputedStyle(inactive).color && getComputedStyle(active).backgroundColor===getComputedStyle(inactive).backgroundColor && getComputedStyle(active).fontWeight===getComputedStyle(inactive).fontWeight) alerts.push(`active ${name} appears indistinct`) }
      return alerts
    })
    warnings.forEach(w=>console.warn(`Step ${i+1}: ${w}`)); await page.screenshot({path:`${dir}/step-${String(i+1).padStart(2,'0')}.png`}); console.log(`Captured step index ${i}`)
  }
  console.log(`Screenshots: ${dir}`)
} catch(error) { console.error(error.message); process.exitCode=1 } finally { if(browser) await browser.close(); if(server) { try { process.kill(-server.pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') throw error } } }
