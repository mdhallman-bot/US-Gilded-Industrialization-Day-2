'use strict';
(() => {
const D=window.LESSON, $=id=>document.getElementById(id);
const token=D.token;
new ResizeObserver(entries=>document.documentElement.style.setProperty('--header-height',document.querySelector('header').getBoundingClientRect().height+'px')).observe(document.querySelector('header')); 
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let studentId='', revision=0, dirty=false, saving=false, pending=null, timer=null, connected=false, conflicted=false;
let localAvailable=true, editSerial=0, vocabMeta={firstScore:null,latestScore:null,checked:false};
const status=s=>$('saveStatus').textContent=s;
const key=id=>`${D.id}:${id}`;
function response(container,id,label,hint='') {
 container.classList.add('response');
 container.innerHTML=`<label for="r-${id}">${esc(label)}</label>${hint?`<p class="hint" id="hint-${id}">${esc(hint)}</p>`:''}<textarea id="r-${id}" data-answer="${id}" maxlength="1400" ${hint?`aria-describedby="hint-${id}"`:''} spellcheck="true"></textarea>`;
}
document.querySelectorAll('[data-response]').forEach(el=>response(el,el.dataset.response,el.dataset.label,el.dataset.hint));
for(let i=1;i<=6;i++){
 const el=document.createElement('article');el.className='station';el.innerHTML=`<h3>Station ${i}</h3>`;
 const box=document.createElement('div');response(box,`station${i}`,`Station ${i}: record one specific observation from the wall evidence and one question or possible implication.`);
 el.append(box);$('stations').append(el);
}
$('metrics').innerHTML=D.metrics.map(m=>`<details><summary>${esc(m.title)}</summary><p class="stat">${esc(m.stat)}</p><p>${esc(m.text)}</p><p class="source">${esc(m.source)}</p></details>`).join('');
$('sourceList').innerHTML=D.sources.map(([name,url,note])=>`<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a> — ${esc(note)}</li>`).join('');
const order=[5,2,7,0,6,3,1,4];
$('vocabCheck').innerHTML=D.vocab.map(([term],i)=>`<div class="vocab-row" id="vrow-${i}"><label for="v-${i}">${esc(term)}</label><select id="v-${i}" data-vocab="${i}"><option value="">Choose a definition…</option>${order.map(j=>`<option value="${j}">${esc(D.vocab[j][1])}</option>`).join('')}</select><p class="selected-definition" id="selected-${i}"></p></div>`).join('');
function hydrateTerms(){
 document.querySelectorAll('[data-term]').forEach(el=>makeTerm(el,el.dataset.term));
 const terms=Object.keys(D.definitions).sort((a,b)=>b.length-a.length);
 const pattern=new RegExp('\\b('+terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','gi');
 const walker=document.createTreeWalker($('main'),NodeFilter.SHOW_TEXT,{acceptNode(node){
  return node.parentElement.closest('button,textarea,select,option,label,svg,#vocab,#sources,[data-term],.tip')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
 }});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 const lookup=Object.fromEntries(terms.map(t=>[t.toLowerCase(),t]));
 for(const node of nodes){const text=node.textContent;pattern.lastIndex=0;if(!pattern.test(text))continue;
  pattern.lastIndex=0;let at=0,match,fragment=document.createDocumentFragment();
  while((match=pattern.exec(text))){fragment.append(document.createTextNode(text.slice(at,match.index)));const span=document.createElement('span');span.textContent=match[0];fragment.append(makeTerm(span,lookup[match[0].toLowerCase()]));at=pattern.lastIndex;}
  fragment.append(document.createTextNode(text.slice(at)));node.replaceWith(fragment);
 }
}
let tipCount=0;
function makeTerm(el,term){const def=D.definitions[term];if(!def)return;
 const btn=document.createElement('button');btn.type='button';btn.className='term';btn.append(document.createTextNode(el.textContent));
 const tip=document.createElement('span');tip.className='tip';tip.id=`tip-${++tipCount}`;tip.setAttribute('role','tooltip');tip.textContent=def;btn.append(tip);btn.setAttribute('aria-describedby',tip.id);
 btn.addEventListener('click',()=>btn.classList.toggle('open'));btn.addEventListener('blur',()=>btn.classList.remove('open'));btn.addEventListener('keydown',e=>{if(e.key==='Escape'){btn.classList.remove('open');btn.blur();}});el.replaceWith(btn);return btn;
}
hydrateTerms();
function svg(title,body,height=330){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ${height}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect width="900" height="${height}" fill="white"/><g font-family="Arial,sans-serif" fill="#172c3b">${body}</g></svg>`;}
function timeline(mode='long'){
 const ranges={long:[1,2000,[1,500,1000,1500,2000]],zoom:[1750,2000,[1750,1800,1850,1900,1950,2000]],us:[1865,1920,[1865,1880,1900,1920]]};
 const [lo,hi,ticks]=ranges[mode],x=y=>65+(y-lo)/(hi-lo)*770;
 let b=`<text x="65" y="30" font-size="18" font-weight="bold">${lo===1?'1 CE':lo}–${hi}: proportional time</text><rect x="${x(1865)}" y="58" width="${x(1920)-x(1865)}" height="70" fill="#ead8c6"/><line x1="65" y1="128" x2="835" y2="128" stroke="#172c3b" stroke-width="2"/>`;
 for(const t of ticks)b+=`<line x1="${x(t)}" y1="123" x2="${x(t)}" y2="137" stroke="#172c3b"/><text x="${x(t)}" y="159" font-size="14" text-anchor="middle">${t===1?'1 CE':t}</text>`;
 b+=`<text x="65" y="198" font-size="14">Shaded interval: United States, 1865–1920</text>`;
 $('timeline').innerHTML=svg('Timeline with proportional spacing and United States focus from 1865 to 1920',b,220);
}
function gdp(mode='zoom'){
 const [lo,hi,ticks,max]=mode==='long'?[1270,2000,[1270,1500,1750,2000],50000]:mode==='us'?[1865,1920,[1865,1880,1900,1920],12000]:[1750,2000,[1750,1800,1850,1900,1950,2000],50000];
 const x=y=>76+(y-lo)/(hi-lo)*754, y=v=>260-v/max*200;
 let b=`<text x="76" y="25" font-size="16" font-weight="bold">GDP per capita · 2011 international dollars</text>`;
 for(let v=0;v<=max;v+=max/4)b+=`<line x1="76" y1="${y(v)}" x2="830" y2="${y(v)}" stroke="#e1e5e6"/><text x="66" y="${y(v)+5}" font-size="12" text-anchor="end">${v.toLocaleString('en-US')}</text>`;
 const rows=D.gdp.filter(r=>r[0]>=lo&&r[0]<=hi);
 for(const [col,color,label] of [[1,'#aa4829','England → Britain/UK'],[2,'#236a6c','United States']]){
  if(mode==='us'&&col===1)continue;
  const points=rows.filter(r=>r[col]!==null);
  b+=`<polyline points="${points.map(r=>`${x(r[0])},${y(r[col])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
  b+=points.map(r=>`<circle cx="${x(r[0])}" cy="${y(r[col])}" r="4" fill="${color}"><title>${r[0]}: ${Math.round(r[col]).toLocaleString('en-US')} · ${label}</title></circle>`).join('');
 }
 for(const t of ticks)b+=`<text x="${x(t)}" y="284" font-size="12" text-anchor="middle">${t}</text>`;
 b+=`<text x="76" y="315" font-size="13" fill="#236a6c">● United States</text>`;
 if(mode!=='us')b+=`<text x="255" y="315" font-size="13" fill="#aa4829">● England → Britain/UK (coverage changes)</text>`;
 $('gdpChart').innerHTML=svg('Selected GDP per capita estimates, '+lo+' to '+hi,b,340);
}
function survival(){
 const measures=[{title:'Life expectancy',unit:'Years at birth',ancient:20,max:100,color:'#236a6c',values:[[1900,47.3],[1950,68.2],[1960,69.7],[1970,70.8],[1980,73.7],[1990,75.4],[2000,76.8]]},{title:'Infant mortality',unit:'Deaths before age 1 per 1,000 live births',ancient:400,max:500,color:'#aa4829',values:[[1900,100],[1950,29.2],[1960,26],[1970,20],[1980,12.6],[1990,9.2],[2000,6.89]]}];
 let b='<text x="45" y="26" font-size="18" font-weight="bold">Survival over time · long view and modern zoom</text>';
 for(const [i,m] of measures.entries())for(const zoom of [false,true]){
  const left=65+i*450,top=zoom?390:110,w=345,h=190,lo=zoom?1900:1;
  const scale=zoom&&i===1?120:m.max;
  const x=t=>left+(t-lo)/(2000-lo)*w,y=v=>top+h-v/scale*h;
  b+=`<text x="${left}" y="${top-50}" font-size="16" font-weight="bold">${m.title} · ${zoom?'1900–2000':'1–2000 CE'}</text><text x="${left}" y="${top-28}" font-size="12">${m.unit}</text>`;
  for(let v=0;v<=scale;v+=scale/5)b+=`<line x1="${left}" x2="${left+w}" y1="${y(v)}" y2="${y(v)}" stroke="#dce3e4"/><text x="${left-9}" y="${y(v)+4}" text-anchor="end" font-size="12">${v}</text>`;
  for(const t of zoom?[1900,1950,2000]:[1,500,1000,1500,2000])b+=`<text x="${x(t)}" y="${top+h+22}" text-anchor="middle" font-size="12">${t}</text>`;
  if(!zoom)b+=`<line x1="${x(1)}" y1="${y(m.ancient)}" x2="${x(1900)}" y2="${y(m.values[0][1])}" stroke="#899394" stroke-width="2" stroke-dasharray="7 6"/><circle cx="${x(1)}" cy="${y(m.ancient)}" r="5" fill="white" stroke="#899394" stroke-width="2"><title>Year 1 reference: best guess, Roman-era model, approximately ${m.ancient}. Not a measured year-1 statistic.</title></circle><text x="${left+10}" y="${y(m.ancient)-12}" font-size="13">≈${m.ancient} · best guess*</text>`;
  b+=`<polyline points="${m.values.map(r=>`${x(r[0])},${y(r[1])}`).join(' ')}" fill="none" stroke="${m.color}" stroke-width="3"/>`;
  for(const [t,v] of m.values)b+=`<circle cx="${x(t)}" cy="${y(v)}" r="${zoom?4:2}" fill="${m.color}"><title>${t}: ${t===1900&&i===1?'approximately ':''}${v}</title></circle>`;
  b+=`<text x="${x(2000)-6}" y="${y(m.values.at(-1)[1])-12}" text-anchor="end" font-size="14" fill="${m.color}">${m.values.at(-1)[1]}</text>`;
 }
 b+='<text x="45" y="640" font-size="13">*Ancient reference: Roman-era reconstruction placed at year 1 for comparison.</text><text x="45" y="662" font-size="13">Dashed bridge = illustrative connection, not observed centuries. Solid lines = U.S. benchmarks.</text>';
 $('survivalChart').innerHTML=svg('Life expectancy rises and infant mortality falls. Year 1 Roman-era best guesses: about 20 years and 400 infant deaths per thousand; U.S. benchmarks from 1900 to 2000. Dashed bridges are illustrative, not measured trends.',b,685);
}

function light(){
 let b='<text x="65" y="25" font-size="17" font-weight="bold">Labor hours for 1,000 lumen-hours · logarithmic scale</text>', x=year=>85+(year-1800)/192*730,y=v=>245-(Math.log10(v)+4)/5*190;
 for(const v of [.0001,.001,.01,.1,1,10])b+=`<line x1="85" y1="${y(v)}" x2="815" y2="${y(v)}" stroke="#e1e5e6"/><text x="75" y="${y(v)+4}" text-anchor="end" font-size="12">${v}</text>`;
 b+=`<polyline points="${D.lighting.map(r=>`${x(r[0])},${y(r[2])}`).join(' ')}" fill="none" stroke="#aa4829" stroke-width="3"/>`;
 for(const r of D.lighting)b+=`<circle cx="${x(r[0])}" cy="${y(r[2])}" r="4" fill="#aa4829"><title>${r[0]}: ${r[3]}</title></circle>`;
 for(const year of [1800,1850,1900,1950,1992])b+=`<text x="${x(year)}" y="275" text-anchor="middle" font-size="13">${year}</text>`;
 b+='<text x="65" y="310" font-size="13">Each equal vertical step represents a tenfold change; use the table for exact comparisons.</text>';
 $('lightChart').innerHTML=svg('Labor needed to pay for constant light service falls; logarithmic vertical scale',b,335);
}
$('gdpTable').innerHTML='<table><thead><tr><th>Year</th><th>England / Britain / UK*</th><th>United States</th></tr></thead><tbody>'+D.gdp.map(r=>`<tr><td>${r[0]}</td><td>${Math.round(r[1]).toLocaleString('en-US')}</td><td>${r[2]===null?'Not shown':Math.round(r[2]).toLocaleString('en-US')}</td></tr>`).join('')+'</tbody></table><p class="note">*Early geography changes. Display rounded; calculations use source precision.</p>';
$('lightTable').innerHTML='<table><thead><tr><th>Year</th><th>Technology</th><th>Labor time</th></tr></thead><tbody>'+D.lighting.map(r=>`<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td>${r[3]}</td></tr>`).join('')+'</tbody></table>';
timeline();gdp();survival();light();
document.querySelectorAll('[data-scale]').forEach(btn=>btn.addEventListener('click',()=>{timeline(btn.dataset.scale);document.querySelectorAll('[data-scale]').forEach(b=>b.setAttribute('aria-pressed',b===btn));}));
document.querySelectorAll('[data-gdp]').forEach(btn=>btn.addEventListener('click',()=>{gdp(btn.dataset.gdp);document.querySelectorAll('[data-gdp]').forEach(b=>b.setAttribute('aria-pressed',b===btn));}));
function snapshot(){return {schemaVersion:1,answers:Object.fromEntries([...document.querySelectorAll('[data-answer]')].map(el=>[el.dataset.answer,el.value])),vocab:[...document.querySelectorAll('[data-vocab]')].map(el=>el.value),vocabMeta:{...vocabMeta}};}
function apply(data){
 document.querySelectorAll('[data-answer]').forEach(el=>el.value=String(data?.answers?.[el.dataset.answer]||'').slice(0,1400));
 document.querySelectorAll('[data-vocab]').forEach((el,i)=>{const v=data?.vocab?.[i];el.value=/^[0-7]$/.test(String(v))?String(v):'';});
 vocabMeta={firstScore:null,latestScore:null,checked:false,...data?.vocabMeta};
 renderVocab(false);completion();
}
function cache(){try{localStorage.setItem(key(studentId),JSON.stringify({revision,dirty,pending,state:snapshot(),updatedAt:new Date().toISOString()}));localAvailable=true;}catch(_){localAvailable=false;status('Device backup unavailable — use Save now and export your work.');}}
function getCache(id){try{const value=JSON.parse(localStorage.getItem(key(id))||'null');return value&&value.state?value:null;}catch(_){return null;}}
async function api(payload){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),35000);
 try{const res=await fetch(D.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...payload,secret:token}),redirect:'follow',signal:controller.signal});
  const data=await res.json();if(typeof data.ok!=='boolean')throw Error('Invalid saving response');return data;
 }finally{clearTimeout(timeout);}
}
function begin(id){studentId=id;$('main').inert=false;document.body.classList.add('ready');$('saveNow').disabled=false;$('switchId').hidden=false;completion();}
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const id=$('studentId').value.trim().toUpperCase();if(!/^[A-Z]{2,12}[0-9]{2,12}$/.test(id)){ $('loginMessage').textContent='Create a username with at least two letters followed by at least two numbers, such as RIVER27.';return;}
 $('start').disabled=true;$('loginMessage').textContent='Checking saved work…';const cached=getCache(id);
 try{
  const cloud=await api({action:'load_state',studentId:id});if(!cloud.ok)throw Error(cloud.code);
  if(cloud.found&&!cached&&!confirm('This username already has saved work. If this is your username, choose OK to resume. Otherwise choose Cancel and create a different username.')){$('loginMessage').textContent='Choose a different username with at least two letters followed by at least two numbers.';return;}
  revision=cloud.revision;connected=true;pending=null;dirty=false;conflicted=false;
  if(cached?.dirty){
   apply(cached.state);dirty=true;pending=cached.pending?{...cached.pending,serial:-1}:null;begin(id);
   if(cached.revision!==cloud.revision){
    // A timed-out save may already have landed. Retrying the same request is safe.
    if(pending){revision=cached.revision;await save();}
    else{conflicted=true;$('conflict').showModal();status('Newer cloud work — recovery copy available.');}
   }else{cache();schedule();}
  }else{apply(cloud.interactiveData||{});begin(id);cache();status(cloud.found?'Loaded saved work · '+id:'Ready · '+id);}
 }catch(_){revision=cached?.revision||0;connected=false;pending=cached?.pending?{...cached.pending,serial:-1}:null;dirty=!!cached?.dirty;apply(cached?.state||{});begin(id);status('Offline — cloud resume unavailable. Device copy only; retry Save now.');}
 finally{$('start').disabled=false;}
});
function changed(){if(!studentId)return;editSerial++;dirty=true;cache();completion();schedule();}
function schedule(){clearTimeout(timer);if(!conflicted)timer=setTimeout(save,1800);}
async function save(){
 if(!studentId||saving||conflicted)return;clearTimeout(timer);saving=true;status('Saving…');
 try{
  if(!connected){const cloud=await api({action:'load_state',studentId});if(!cloud.ok)throw Error(cloud.code);
   if(cloud.revision!==revision&&!pending){conflicted=true;$('conflict').showModal();status('Newer cloud work — this tab is preserved.');return;}connected=true;}
  if(!dirty&&!pending){status('Saved to spreadsheet · '+studentId);return;}
  if(!pending){pending={action:'save_state',studentId,interactiveData:snapshot(),baseRevision:revision,requestId:crypto.randomUUID(),serial:editSerial};cache();}
  const {serial,...payload}=pending;const result=await api(payload);
  if(!result.ok){if(result.code==='REVISION_CONFLICT'){conflicted=true;$('conflict').showModal();status('Newer cloud work — download a recovery copy.');return;}throw Error(result.code);}
  revision=result.revision;pending=null;dirty=serial!==editSerial;
  if(result.latestRevision&&result.latestRevision>revision){conflicted=true;$('conflict').showModal();status('A newer tab saved work — reload or recover.');}
  else status('Saved to spreadsheet · '+studentId+' · '+new Date(result.savedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
  cache();if(dirty&&!conflicted)schedule();
 }catch(_){connected=false;cache();status('Not saved to spreadsheet — '+(localAvailable?'device copy kept.':'download a recovery copy.')+' Retry Save now.');}
 finally{saving=false;}
}
$('saveNow').addEventListener('click',save);
document.querySelectorAll('[data-answer]').forEach(el=>{
 el.addEventListener('input',changed);
 for(const event of ['paste','drop'])el.addEventListener(event,e=>{e.preventDefault();status('Type your response in your own words. Pasting is disabled.');});
 el.addEventListener('beforeinput',e=>{if(e.inputType==='insertFromPaste'||e.inputType==='insertFromDrop')e.preventDefault();});
});
document.querySelectorAll('[data-vocab]').forEach(el=>el.addEventListener('change',()=>{vocabMeta.checked=false;renderVocab(false);changed();}));
function renderVocab(check){
 const fields=[...document.querySelectorAll('[data-vocab]')];const score=fields.filter((el,i)=>el.value===String(i)).length;
 if(check){vocabMeta.checked=true;vocabMeta.latestScore=score;if(vocabMeta.firstScore===null)vocabMeta.firstScore=score;}
 fields.forEach((el,i)=>{$('selected-'+i).textContent=el.value===''?'':el.selectedOptions[0].textContent;$('vrow-'+i).classList.remove('correct','incorrect');if(vocabMeta.checked){$('vrow-'+i).classList.add(el.value===String(i)?'correct':'incorrect');el.setAttribute('aria-invalid',el.value!==String(i));}else el.removeAttribute('aria-invalid');});
 $('vocabResult').textContent=vocabMeta.checked?`${vocabMeta.latestScore} of 8 correct. ${vocabMeta.latestScore===8?'Ready to submit.':'Revisit the lesson terms and try again; marked rows show what to review.'} First check: ${vocabMeta.firstScore}/8.`:vocabMeta.firstScore===null?'':`Matches changed. Check again. First score: ${vocabMeta.firstScore}/8.`;
}
$('checkVocab').addEventListener('click',()=>{renderVocab(true);changed();});
function completion(){
 const fields=[...document.querySelectorAll('[data-answer]')], answers=fields.filter(el=>el.value.trim()).length, matches=[...document.querySelectorAll('[data-vocab]')].filter(el=>el.value!=='').length;
 const total=fields.length+9, done=answers+matches+(vocabMeta.checked?1:0), pct=Math.round(done/total*100);
 $('completion').innerHTML=`<strong>${pct}% complete</strong><p>${answers}/${fields.length} responses · ${matches}/8 vocabulary matches · ${vocabMeta.checked?'vocabulary checked':'vocabulary check still needed'}</p><p>Completion records filled fields, not the quality of your historical explanation.</p>`;
 return {pct,answers,matches,total,done};
}
function recovery(){const data={lessonId:D.id,studentId,revision,state:snapshot(),exportedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${studentId}-Day2-recovery.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('backup').addEventListener('click',recovery);$('conflictBackup').addEventListener('click',recovery);
$('reloadCloud').addEventListener('click',async()=>{
 if(!confirm('Have you downloaded a recovery copy? Loading the cloud version replaces the responses displayed in this tab.'))return;
 try{const cloud=await api({action:'load_state',studentId});if(!cloud.ok)throw Error(cloud.code);apply(cloud.interactiveData||{});revision=cloud.revision;dirty=false;pending=null;connected=true;conflicted=false;editSerial++;cache();$('conflict').close();status('Loaded latest saved work · '+studentId);}catch(_){status('Could not load cloud work. This tab is still preserved.');}
});
$('conflict').addEventListener('cancel',e=>e.preventDefault());
$('switchId').addEventListener('click',async()=>{await save();if((dirty||pending)&&!confirm('Some work is not saved to the spreadsheet. A device copy is kept when available. Change ID anyway?'))return;clearTimeout(timer);studentId='';$('main').inert=true;document.body.classList.remove('ready');$('saveNow').disabled=true;$('switchId').hidden=true;$('loginMessage').textContent='';$('studentId').focus();status('Enter your username to begin');});
window.addEventListener('beforeunload',e=>{if(studentId&&(dirty||pending)){cache();e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&studentId){cache();save();}});
window.addEventListener('online',()=>{if(studentId)save();});
function cleanText(el){const copy=el.cloneNode(true);copy.querySelectorAll('.tip,script,style').forEach(e=>e.remove());return copy.textContent.replace(/\s+/g,' ').trim();}
function pdfText(s){return s.replace(/[–—−]/g,'-').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/→/g,' to ').replace(/≈/g,'about ').replace(/↗/g,'').replace(/●/g,'').replace(/…/g,'...').replace(/[^\x20-\x7E\n\u00A0-\u00FF]/g,'');}
async function exportPdf(){
 const btn=$('downloadPdf');btn.disabled=true;$('exportStatus').textContent='Creating your complete work PDF…';
 try{
  if(!window.jspdf)throw Error('PDF library missing');
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'letter'});let y=20;const width=175;
  function write(text,size=11,bold=false){const lines=doc.setFont('helvetica',bold?'bold':'normal').setFontSize(size).splitTextToSize(pdfText(text),width);const step=size*.45;
   for(const line of lines){if(y+step+(bold?12:0)>260){doc.addPage();y=20;}doc.text(line,20,y);y+=step;}y+=3;
  }
  const c=completion();write(`COMPLETION: ${c.pct}% | ${c.answers} responses | ${c.matches}/8 matches | ${vocabMeta.checked?'vocabulary checked':'check pending'}`,13,true);
  write(`Username: ${studentId} | Unit 2 Day 2: Industrial Transformation`,12,true);
  write(`Exported ${new Date().toLocaleString()} | Cloud revision ${revision}. ${dirty||pending?'Unsaved local changes included.':'Last acknowledged cloud version.'}`,9);
  write('This PDF contains the pre-Boost lesson and student work. Submit the separate Google Doc for the interview and formative reflection.',10);
  async function visit(el){
   if(el.matches?.('.response')){write(cleanText(el.querySelector('label')),11,true);write(el.querySelector('textarea').value.trim()||'[No response entered]',11);return;}
   if(el.matches?.('.chart')){
    const svgEl=el.querySelector('svg');if(!svgEl)return;const view=svgEl.viewBox.baseVal;
    const image=new Image();const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svgEl)],{type:'image/svg+xml'}));
    try{await new Promise((res,rej)=>{image.onload=res;image.onerror=rej;image.src=url;});const canvas=document.createElement('canvas');canvas.width=view.width*2;canvas.height=view.height*2;canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const h=width*view.height/view.width;if(y+h>260){doc.addPage();y=20;}doc.addImage(canvas.toDataURL('image/jpeg',.9),'JPEG',20,y,width,h);y+=h+5;}finally{URL.revokeObjectURL(url);}return;
   }
   if(el.id==='vocabCheck'){
    D.vocab.forEach(([term],i)=>{const select=$('v-'+i);write(`${term}: ${select.value===''?'[No match selected]':select.selectedOptions[0].textContent}`,10);});return;
   }
   if(el.matches?.('table')){for(const row of el.rows)write([...row.cells].map(cleanText).join(' | '),9);return;}
   if(el.matches?.('h1,h2,h3')){write(cleanText(el),el.tagName==='H1'?21:el.tagName==='H2'?17:13,true);return;}
   if(el.closest?.('#sourceList') && el.matches?.('li')){write(cleanText(el)+' '+el.querySelector('a').href,9);return;}
   if(el.matches?.('p,li,.inquiry,.completion')){write(cleanText(el),el.classList.contains('source')||el.classList.contains('note')?9:11);return;}
   if(el.matches?.('summary')){write(cleanText(el),12,true);return;}
   if(el.matches?.('button,select,textarea,.controls'))return;
   if(el.matches?.('a')){if(el.classList.contains('button'))write(`${cleanText(el)}: ${el.href}`,9);return;}
   for(const child of el.children)await visit(child);
  }
  for(const section of $('main').children)await visit(section);
  const pages=doc.getNumberOfPages();for(let n=1;n<=pages;n++){doc.setPage(n);doc.setFont('helvetica','normal').setFontSize(8);doc.text(`${studentId} · Industrial Transformation | ${n}/${pages}`,20,273);}
  doc.save(`${studentId}-Industrial-Transformation-Day2.pdf`);$('exportStatus').textContent='PDF downloaded. Open and check it, then submit it to Google Classroom.';
 }catch(_){$('exportStatus').textContent='PDF export failed. Download a recovery copy and tell your teacher; your responses remain in this tab.';}
 finally{btn.disabled=false;}
}
$('downloadPdf').addEventListener('click',exportPdf);
completion();
})();
