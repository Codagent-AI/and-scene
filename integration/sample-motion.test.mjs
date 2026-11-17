import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
test('E2E-001 sample departures animate and required connections meet', async () => {
 const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4175','--strictPort'],{stdio:'ignore',detached:true}); let browser
 try {
  let ready=false; for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4175/')).ok){ready=true;break}}catch{} await new Promise(r=>setTimeout(r,100))} assert.ok(ready)
  browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:1440,height:900}}); await page.goto('http://127.0.0.1:4175/how-to-make-a-presentation')
  await page.getByLabel('Step 7: It checks its own work').click(); await page.waitForTimeout(1100)
  const geometry=await page.evaluate(()=>{ const r=id=>document.querySelector(`[data-presentation-entity="${id}"]`).getBoundingClientRect(); const tray=r('tray'),kit=r('kit'),ghost=r('ghost'),link=r('verify-link'),verify=r('verify'); return {gap:Math.abs(tray.bottom-kit.top),left:Math.abs(ghost.right-link.left),right:Math.abs(link.right-verify.left)} })
  assert.ok(geometry.gap<1 && geometry.left<1 && geometry.right<1,JSON.stringify(geometry))
  const ghost=page.locator('[data-presentation-entity="ghost"]'); await page.getByLabel('Step 4: The deck grows').click(); assert.equal(await ghost.count(),1,'departing ghost stays mounted during exit'); await page.waitForFunction(() => { const node=document.querySelector('[data-presentation-entity="ghost"]'); if (!node) return false; const opacity=Number(getComputedStyle(node).opacity); return opacity > 0 && opacity < 0.95 }, null, { timeout: 3000 }); await ghost.waitFor({state:'detached',timeout:3000})
 } finally { await browser?.close(); try{process.kill(-server.pid,'SIGTERM')}catch{} }
})
