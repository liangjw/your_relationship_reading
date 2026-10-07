import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const assets=JSON.parse(fs.readFileSync('artwork/personality-v2/scenes-source.json','utf8'));
for(const a of assets){const original='artwork/personality-v2/scene-'+a.id+'.png';fs.copyFileSync(a.path,original);await sharp(original).resize(1200,800,{fit:'contain',background:'#fff8f2'}).webp({quality:84}).toFile('frontend/assets/v2-cute-'+a.id+'.webp');a.original=original;delete a.path;a.src='/assets/v2-cute-'+a.id+'.webp';}
fs.writeFileSync('artwork/personality-v2/scenes-manifest.json',JSON.stringify({mode:'built-in imagegen',assets},null,2));
