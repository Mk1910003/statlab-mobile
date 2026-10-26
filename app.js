const $ = id => document.getElementById(id);
let headers = [], rows = [], numeric = [];
const sampleCSV = `hours_studied,exam_score,age
2,52,19
3,58,20
4,61,21
5,67,20
6,72,22
7,78,21
8,84,23
9,88,22
10,93,24
4,63,20
6,70,21
8,82,23`;

function setStatus(message, error=false){ $('status').textContent=message; $('status').className='status'+(error?' error':''); }
function parseCSV(text){
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  if(lines.length<2) throw new Error('CSV file must include a header and at least one data row.');
  const parseLine=line=>{let out=[],v='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'&&quoted){v+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===','&&!quoted){out.push(v.trim());v='';}else v+=c;}out.push(v.trim());return out;};
  const hs=parseLine(lines[0]); if(new Set(hs).size!==hs.length||hs.some(x=>!x)) throw new Error('Column names must be non-empty and unique.');
  const data=lines.slice(1).filter(x=>x.trim()).map(line=>{const a=parseLine(line);if(a.length!==hs.length)throw new Error('Each row must have the same number of columns.');return Object.fromEntries(hs.map((h,i)=>[h,a[i]]));});
  return {hs,data};
}
function loadCSV(text, label){
  try{
    const parsed=parseCSV(text); headers=parsed.hs; rows=parsed.data;
    numeric=headers.filter(h=>rows.some(r=>r[h]!==''&&Number.isFinite(Number(r[h])))&&rows.filter(r=>r[h]!=='').every(r=>Number.isFinite(Number(r[h]))));
    renderTable(); fillSelects(); $('download').disabled=false;
    setStatus(`Loaded ${label}: ${rows.length} rows and ${headers.length} columns. Numeric columns detected: ${numeric.length}.`);
    if(numeric.length) describe();
    else {$('metrics').innerHTML='';$('frequency').textContent='No numeric columns detected.';}
  }catch(e){setStatus(e.message,true);}
}
function renderTable(){
  $('dimensions').textContent=`${rows.length} rows · ${headers.length} columns · previewing first 12 rows`;
  const t=$('preview');t.replaceChildren();const thead=document.createElement('thead'),tr=document.createElement('tr');
  headers.forEach(h=>{const th=document.createElement('th');th.textContent=h;tr.append(th);});thead.append(tr);t.append(thead);
  const tb=document.createElement('tbody');rows.slice(0,12).forEach(r=>{const tr=document.createElement('tr');headers.forEach(h=>{const td=document.createElement('td');td.textContent=r[h];tr.append(td);});tb.append(tr);});t.append(tb);
}
function fillSelects(){
  ['variable','xcor','ycor','xreg','yreg','histvar'].forEach(id=>{const s=$(id);s.replaceChildren();numeric.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;s.append(o);});s.disabled=numeric.length===0;});
  if(numeric.length>1){$('ycor').selectedIndex=1;$('yreg').selectedIndex=1;}
  ['describe','correlate','regress','hist'].forEach(id=>$(id).disabled=numeric.length===0);
}
function vals(name){return rows.map(r=>r[name]===''?NaN:Number(r[name])).filter(Number.isFinite);}
function mean(a){return a.reduce((s,x)=>s+x,0)/a.length;}
function quantile(a,p){const s=[...a].sort((x,y)=>x-y),pos=(s.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos);return s[lo]+(s[hi]-s[lo])*(pos-lo);}
function sd(a){if(a.length<2)return NaN;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1));}
function fmt(x){return Number.isFinite(x)?x.toLocaleString(undefined,{maximumFractionDigits:4}):'Not available';}
function metric(label,value){return `<div class="metric"><div class="label">${label}</div><div class="value">${fmt(value)}</div></div>`;}
function describe(){
  const name=$('variable').value,a=vals(name);if(!a.length)return;
  const m=mean(a),median=quantile(a,.5),modeMap=new Map();a.forEach(x=>modeMap.set(x,(modeMap.get(x)||0)+1));
  const maxfreq=Math.max(...modeMap.values()),modes=[...modeMap].filter(([,c])=>c===maxfreq).map(([v])=>v);
  $('metrics').innerHTML=metric('Valid N',a.length)+metric('Mean',m)+metric('Median',median)+metric('SD (sample)',sd(a))+metric('Variance (sample)',sd(a)**2)+metric('Minimum',Math.min(...a))+metric('Maximum',Math.max(...a))+metric('Q1 / Q3',`${fmt(quantile(a,.25))} / ${fmt(quantile(a,.75))}`);
  $('frequency').textContent=`Mode: ${modes.length===a.length?'No unique mode':modes.slice(0,5).join(', ')} · Missing/non-numeric values excluded: ${rows.length-a.length}`;
}
function paired(xname,yname){
  const pairs=rows.map(r=>[Number(r[xname]),Number(r[yname])]).filter(([x,y])=>Number.isFinite(x)&&Number.isFinite(y));
  return {x:pairs.map(p=>p[0]),y:pairs.map(p=>p[1])};
}
function correlation(x,y){
  if(x.length!==y.length||x.length<2)return NaN;
  const mx=mean(x),my=mean(y);let num=0,dx=0,dy=0;
  for(let i=0;i<x.length;i++){num+=(x[i]-mx)*(y[i]-my);dx+=(x[i]-mx)**2;dy+=(y[i]-my)**2;}
  return dx===0||dy===0?NaN:num/Math.sqrt(dx*dy);
}
$('file').addEventListener('change',async e=>{const f=e.target.files[0];if(f)loadCSV(await f.text(),f.name);});
$('sample').addEventListener('click',()=>loadCSV(sampleCSV,'sample dataset'));
$('variable').addEventListener('change',describe);$('describe').addEventListener('click',describe);
$('correlate').addEventListener('click',()=>{const x=$('xcor').value,y=$('ycor').value,p=paired(x,y),r=correlation(p.x,p.y);$('corResult').textContent=`Pearson correlation r = ${fmt(r)} · paired observations n = ${p.x.length}. Correlation does not imply causation.`;});
$('regress').addEventListener('click',()=>{
  const xname=$('xreg').value,yname=$('yreg').value,p=paired(xname,yname),x=p.x,y=p.y;
  if(x.length<3){$('regResult').textContent='At least 3 paired observations are recommended.';return;}
  const mx=mean(x),my=mean(y),den=x.reduce((s,v)=>s+(v-mx)**2,0);
  if(!den){$('regResult').textContent='Regression cannot be fitted because X has zero variance.';return;}
  const slope=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/den,intercept=my-slope*mx;
  const ssTot=y.reduce((s,v)=>s+(v-my)**2,0),ssRes=y.reduce((s,v,i)=>s+(v-(intercept+slope*x[i]))**2,0),r2=ssTot?1-ssRes/ssTot:NaN;
  $('regResult').textContent=`Model: ${yname} = ${fmt(intercept)} + ${fmt(slope)} × ${xname}. R² = ${fmt(r2)} · n = ${x.length}. This MVP does not yet provide inferential tests or confidence intervals.`;
});
function drawHistogram(){
  const a=vals($('histvar').value),canvas=$('chart'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!a.length)return;const min=Math.min(...a),max=Math.max(...a),k=Math.max(1,Math.min(12,Math.ceil(Math.sqrt(a.length)))),range=max-min||1,counts=Array(k).fill(0);
  a.forEach(v=>counts[Math.min(k-1,Math.floor((v-min)/range*k))]++);
  const pad=38,w=canvas.width-pad*2,h=canvas.height-pad*2,bw=w/k,maxc=Math.max(...counts);
  ctx.strokeStyle='#8ba2ab';ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,canvas.height-pad);ctx.lineTo(canvas.width-pad,canvas.height-pad);ctx.stroke();
  counts.forEach((c,i)=>{const bh=c/maxc*h;ctx.fillStyle='#16866c';ctx.fillRect(pad+i*bw+2,canvas.height-pad-bh,Math.max(1,bw-4),bh);});
  ctx.fillStyle='#172b35';ctx.font='14px system-ui';ctx.fillText('Frequency',5,18);ctx.fillText(fmt(min),pad,canvas.height-10);ctx.fillText(fmt(max),canvas.width-pad-35,canvas.height-10);
}
$('hist').addEventListener('click',drawHistogram);$('histvar').addEventListener('change',drawHistogram);
$('download').addEventListener('click',()=>{if(!rows.length)return;const csv=[headers.join(','),...rows.map(r=>headers.map(h=>{const s=String(r[h]??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}).join(','))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='statlab-data.csv';a.click();URL.revokeObjectURL(url);});
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
