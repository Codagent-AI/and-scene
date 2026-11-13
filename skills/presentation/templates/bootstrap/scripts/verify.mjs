import { fileURLToPath } from 'node:url'
import { command, withBrowser, captureErrors, waitStep } from './browser.mjs'
import { REFERENCE, validateReference } from './reference.mjs'
export async function verify(root, slug) {
 await command('npm',['run','build'],root)
 await withBrowser(root,async(page,preview)=>{
  const assertClean=captureErrors(page)
  let index=0
  try {
   await page.goto(preview.url)
   const target=slug ?? REFERENCE.slug
   if(await page.locator(`a[href="/${target}"]`).count()!==1)throw new Error(`reference: missing registered presentation ${target}`)
   await page.goto(`${preview.url}/${target}`)
   await page.locator('[data-presentation-root]').waitFor({timeout:10000})
   const count=Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
   if(!Number.isInteger(count)||count<1)throw new Error('reference: invalid step count')
   const steps=[]
   for(index=0;index<count;index++) {
    await waitStep(page,index);assertClean()
    steps.push(await page.evaluate(()=>({
     era:document.querySelector('[data-presentation-toc] [aria-current="step"]')?.textContent,
     title:document.querySelector('[data-presentation-title]')?.textContent,
     caption:document.querySelector('[data-presentation-caption]')?.textContent,
    })))
    console.log(`render: step ${index} OK`)
    if(index<count-1)await page.keyboard.press('ArrowRight')
   }
   if(!slug)validateReference({title:await page.locator('[data-presentation-name]').textContent(),steps})
  } catch(error){
   let failure=error
   try { assertClean() } catch(browserError) { failure=browserError }
   throw new Error(`render/reference step ${index}: ${failure.message}`,{cause:error})
  }
 })
 console.log('PASS: build, registration, metadata and every step rendered')
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const root=fileURLToPath(new URL('..',import.meta.url))
 verify(root,process.argv[2]).catch(error=>{console.error(`FAIL: ${error.message}`);process.exitCode=1})
}
