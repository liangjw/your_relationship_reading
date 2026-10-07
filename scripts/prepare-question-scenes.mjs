import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const sources=JSON.parse(fs.readFileSync('artwork/question-scenes/source-manifest.json','utf8').replace(/^\uFEFF/,''));
fs.mkdirSync('frontend/assets/scenes',{recursive:true});
const manifest=[];
for(const q of sources){
 fs.copyFileSync(q.source,`artwork/question-scenes/${q.id}.png`);
 const dest=`frontend/assets/scenes/${q.id}.webp`;
 await sharp(q.source).resize(1200,800,{fit:'cover'}).webp({quality:82}).toFile(dest);
 const data=fs.readFileSync(dest);
 manifest.push({id:q.id,src:`/assets/scenes/${q.id}.webp`,context:q.context,prompt:q.prompt,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
}
if(manifest.length!==40||new Set(manifest.map(q=>q.sha256)).size!==40)throw new Error('Scene illustrations must be 40 distinct files');
fs.writeFileSync('artwork/question-scenes/manifest.json',JSON.stringify(manifest,null,2));
console.log('Prepared 40 unique scene artworks:',Math.round(manifest.reduce((n,q)=>n+q.bytes,0)/1024),'KiB');
