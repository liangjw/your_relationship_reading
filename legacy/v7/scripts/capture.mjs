import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
fs.mkdirSync('artifacts',{recursive:true});
try{
 for(const [name,width,height]of [['home-mobile',390,844],['home-desktop',1280,900]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto('http://localhost:4173');await page.locator('.intro-comic img').waitFor();
  await page.screenshot({path:`artifacts/v7-${name}.png`,fullPage:true});await context.close();
 }
 console.log('Clean preview captures saved.');
}finally{await browser.close();}

