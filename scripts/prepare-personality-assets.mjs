import fs from 'node:fs';
import { createRequire } from 'node:module';
import { MASCOTS } from '../backend/presentation/mascots.mjs';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const sources = JSON.parse(fs.readFileSync('artwork/personality-v2/source-manifest.json', 'utf8'));
const inline = {}, manifest = [];
for (const asset of sources) {
  const original = 'artwork/personality-v2/' + asset.id + '.png';
  fs.copyFileSync(asset.path, original);
  const mascot = MASCOTS.find(m => m.id === asset.id);
  const output = 'frontend' + mascot.src;
  await sharp(original).resize(640,640,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:84,alphaQuality:100}).toFile(output);
  const stats = await sharp(output).stats(), metadata = await sharp(output).metadata();
  if (!metadata.hasAlpha || stats.channels[3].min !== 0) throw new Error('Transparency lost: '+output);
  inline[asset.id] = 'data:image/webp;base64,' + fs.readFileSync(output).toString('base64');
  manifest.push({...mascot, original, bytes:fs.statSync(output).size, width:640,height:640,prompt:asset.prompt});
}
fs.writeFileSync('backend/presentation/mascot-inline.mjs', '// Generated from frontend/assets/mascot-type-*.webp; embedded for portable SVG-to-PNG sharing.\nexport default '+JSON.stringify(inline)+';\n');
fs.writeFileSync('artwork/personality-v2/manifest.json', JSON.stringify({mode:'built-in imagegen',transparent:true,assets:manifest},null,2));
console.log(manifest.map(({id,bytes})=>({id,bytes})));
