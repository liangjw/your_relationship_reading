import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const base='C:/Users/Mayn/.codex/generated_images/01a1107a-5e98-7af0-99af-88e150d29af6/';
const files={cover:'exec-577f5cd2-961f-4ca8-9a16-e8970ab2f666.png',home:'exec-32d7ce34-5a64-4428-bd6f-f7cb26a81fd9.png',cafe:'exec-b869ea25-8d86-4394-8553-06d0d40caee3.png',city:'exec-2cc1e5b5-afd1-4c3d-869a-b90867a74123.png'};
fs.mkdirSync('artwork/v2',{recursive:true});fs.mkdirSync('frontend/assets',{recursive:true});
for(const [id,file] of Object.entries(files)){fs.copyFileSync(base+file,'artwork/v2/'+id+'.png');await sharp(base+file).webp({quality:84,effort:6}).toFile('frontend/assets/v2-'+id+'.webp');}
console.log('Four V2 boards saved and optimized without cropping.');
