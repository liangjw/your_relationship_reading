import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
fs.mkdirSync('artwork/manga-v7',{recursive:true});
for(const {name,path} of JSON.parse(fs.readFileSync('artwork/manga-v7-manifest.json'))){
 fs.copyFileSync(path,`artwork/manga-v7/${name}.png`);
 await sharp(path).webp({quality:83,effort:6}).toFile(`assets/manga-${name}-v7.webp`);
 console.log(name,fs.statSync(`assets/manga-${name}-v7.webp`).size);
}
