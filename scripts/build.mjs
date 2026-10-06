import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});
// Remove only a known obsolete generated file; never recursively delete the build directory.
if(fs.existsSync('dist/core.js'))fs.unlinkSync('dist/core.js');
for(const file of ['index.html','styles.css','app.js','game-core.js','game-data.js','game-view.js','scene-stage.js','assessment-data.js','personality.js','active-timer.js','illustrations.js','report-ai.js','data.js','wechat-share.js','manifest.webmanifest','sw.js'])fs.copyFileSync(file,`dist/${file}`);
fs.cpSync('assets','dist/assets',{recursive:true});
fs.copyFileSync('_headers','dist/_headers');
console.log('静态站点已生成：dist/');
