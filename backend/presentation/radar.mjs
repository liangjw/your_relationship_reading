const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const point = (i,r) => { const a=-Math.PI/2+i*Math.PI/3; return [180+Math.cos(a)*r,165+Math.sin(a)*r]; };
const coords = p => p.map(v=>v.toFixed(2)).join(',');
export function radarValues(metrics) {
  return metrics.map(m=>({...m,radarLabel:m.lowerIsBetter?'性别校准':m.label,radarValue:m.value==null?null:m.lowerIsBetter?100-m.value:m.value}));
}
export function radarMarkup(metrics,{embedded=false}={}) {
  const values=radarValues(metrics), complete=values.every(m=>m.radarValue!=null);
  const grids=[.25,.5,.75,1].map(scale=>`<polygon points="${values.map((_,i)=>coords(point(i,97*scale))).join(' ')}" fill="${scale===1?'#fcf3f7':'none'}" stroke="#e4c9d5" stroke-width="1"/>`).reverse().join('');
  const axes=values.map((m,i)=>`<line x1="180" y1="165" x2="${point(i,97)[0].toFixed(2)}" y2="${point(i,97)[1].toFixed(2)}" stroke="#e4c9d5"${m.radarValue==null?' stroke-dasharray="3 3"':''}/>`).join('');
  const polygon=complete?`<polygon class="radar-shape" points="${values.map((m,i)=>coords(point(i,97*m.radarValue/100))).join(' ')}" fill="#c4739140" stroke="#8d3e55" stroke-width="2.5" stroke-linejoin="round"/>`:'';
  const dots=values.map((m,i)=>m.radarValue==null?'':`<circle class="radar-point" cx="${point(i,97*m.radarValue/100)[0].toFixed(2)}" cy="${point(i,97*m.radarValue/100)[1].toFixed(2)}" r="4" fill="#8d3e55" stroke="#fffdfb" stroke-width="1.5"/>`).join('');
  const labels=values.map((m,i)=>{const [x,y]=point(i,140);return `<text x="${x.toFixed(2)}" y="${(y-4).toFixed(2)}" text-anchor="middle" fill="#58424c" font-size="14">${escape(m.radarLabel)}<tspan x="${x.toFixed(2)}" dy="20" fill="#8d3e55" font-weight="bold">${m.radarValue??'未评估'}</tspan></text>`;}).join('');
  const inner=`<g font-family="Microsoft YaHei, sans-serif">${grids}${axes}${polygon}${dots}${labels}</g>`;
  return embedded?inner:`<svg class="observation-radar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 330" role="img" aria-label="六维观察地图，向外表现越强。${escape(values.map(m=>m.radarLabel+' '+(m.radarValue??'未评估')).join('；'))}">${inner}</svg>`;
}
