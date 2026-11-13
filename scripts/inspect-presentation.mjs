import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { withBrowser, captureErrors, SETTLE_MS } from './browser.mjs'
import { collectVisualState, diagnostics } from './diagnostics.mjs'
export async function inspectPresentation(root,slug,{settle=SETTLE_MS}={}) {
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug??''))throw new Error('inspection: supply a registered presentation slug')
 if(!Number.isFinite(settle)||settle<SETTLE_MS)throw new Error(`inspection: settle must be at least ${SETTLE_MS}ms`)
 const directory=path.join(root,'artifacts','inspection',slug)
 await mkdir(directory,{recursive:true})
 return withBrowser(root,async(page,preview)=>{
  const assertClean=captureErrors(page)
  await page.goto(preview.url)
  if(await page.locator(`a[href="/${slug}"]`).count()!==1)throw new Error(`inspection: unknown presentation ${slug}`)
  await page.goto(`${preview.url}/${slug}`)
  const host=page.locator('[data-presentation-root]');await host.waitFor()
  const count=Number(await host.getAttribute('data-step-count')),report=[]
  for(let index=0;index<count;index++) {
   await page.locator(`[data-presentation-root][data-step-index="${index}"]`).waitFor({timeout:5000})
   const arrived=Date.now();await page.waitForTimeout(settle);assertClean()
   const settledMs=Date.now()-arrived
   const warnings=diagnostics(await page.evaluate(collectVisualState),index)
   const file=`step-${String(index+1).padStart(2,'0')}.png`
   await page.screenshot({path:path.join(directory,file),fullPage:true})
   report.push({index,file,settledMs,warnings})
   console.log(`capture: step ${index} ${file} settled >= ${settle}ms`)
   warnings.forEach(warning=>console.warn(`WARNING: ${warning}`))
   if(index<count-1)await page.keyboard.press('ArrowRight')
  }
  await writeFile(path.join(directory,'report.json'),JSON.stringify({viewport:{width:1440,height:900},settle,steps:report},null,2)+'\n')
  console.log(`inspection artifacts: ${directory} (advisory only)`)
  return report
 })
}
if(process.argv[1]===fileURLToPath(import.meta.url))inspectPresentation(fileURLToPath(new URL('..',import.meta.url)),process.argv[2]).catch(error=>{console.error(`FAIL: ${error.message}`);process.exitCode=1})
