import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createReportHandler} from './report-service.js';
const root=process.cwd(), port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const reportHandler=createReportHandler();
http.createServer((req,res)=>{
  if(req.url.split('?')[0]==='/api/report'){reportHandler(req,res);return;}
  let file; try {file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));} catch {res.writeHead(400);res.end();return;}
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(file===root)file=path.join(root,'index.html');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()||path.relative(root,file).split(path.sep).some(p=>p.startsWith('.'))){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(path.basename(file)==='index.html'&&process.env.OPENAI_API_KEY&&process.env.OPENAI_REPORT_MODEL){res.end(fs.readFileSync(file,'utf8').replace('name="report-narrative-endpoint" content=""','name="report-narrative-endpoint" content="/api/report"'));return;}
  fs.createReadStream(file).pipe(res);
}).listen(port,'0.0.0.0',()=>console.log(`心动译码 http://localhost:${port}`));
