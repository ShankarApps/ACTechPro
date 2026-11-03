/* AC Tech Pro: HVAC Calculators (offline, no libraries). Stages A to C. */
(function(){
var $=function(i){return document.getElementById(i);};
var IC={snow:'<path d="M12 2v20M4.2 7l15.6 10M19.8 7 4.2 17"/>',gauge:'<path d="M4 16a8 8 0 1 1 16 0M12 16l4-5"/><circle cx="12" cy="16" r="1"/>',therm:'<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/>',wind:'<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8"/>',bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',cable:'<path d="M4 6h6v12h4V6h6"/>',coin:'<circle cx="12" cy="12" r="9"/><path d="M9 8h6M9 12h6M10 8c4 0 4 5 0 5l4 4"/>'};
function fmt(v){if(!isFinite(v))return'';if(v===0)return'0';var a=Math.abs(v),d=a>=1000?1:a>=100?2:a>=1?3:4,s=v.toFixed(d);return s.indexOf('.')>=0?s.replace(/0+$/,'').replace(/\.$/,''):s;}
function num(s){var n=parseFloat(String(s).replace(',','.'));return isNaN(n)?null:n;}
/* linked fields: type in any one box, the others update (everything goes through one base unit) */
function linked(body,o){
  var html='';if(o.chips)html+='<div class="cchips">'+o.chips.map(function(c){return'<button type="button" class="cchip" data-v="'+c+'">'+c+' '+o.chipUnit+'</button>';}).join('')+'</div>';
  o.fields.forEach(function(f){html+='<div class="cf" id="cf_'+f.id+'"><label for="in_'+f.id+'">'+f.label+'</label><input id="in_'+f.id+'" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></div>';});
  html+='<div class="calc-actions"><button type="button" id="cReset" class="calc-btn">Reset</button><button type="button" id="cCopy" class="calc-btn pri">Copy result</button></div>';
  if(o.note)html+='<p class="calc-note">'+o.note+'</p>';
  html+='<details class="calc-how"><summary>How it is calculated</summary>'+o.how+'</details>';
  body.innerHTML=html;
  function run(src){var v=num($('in_'+src.id).value);o.fields.forEach(function(f){$('cf_'+f.id).classList.toggle('src',f===src);if(f===src)return;$('in_'+f.id).value=v===null?'':fmt(src.from(v,f));});}
  o.fields.forEach(function(f){f.from=null;});
  o.fields.forEach(function(f){f.from=function(v,t){return t.fromBase(f.toBase(v));};
    $('in_'+f.id).addEventListener('input',function(){run(f);});});
  body.querySelectorAll('.cchip').forEach(function(b){b.onclick=function(){var f=o.fields[0];$('in_'+f.id).value=b.getAttribute('data-v');run(f);};});
  $('cReset').onclick=function(){o.fields.forEach(function(f){$('in_'+f.id).value='';$('cf_'+f.id).classList.remove('src');});};
  $('cCopy').onclick=function(){var t=o.fields.map(function(f){var v=$('in_'+f.id).value;return v?v+' '+f.unit:'';}).filter(Boolean).join(' = ');if(!t)return;t+='  (AC Tech Pro)';
    var done=function(){var b=$('cCopy');b.textContent='Copied';setTimeout(function(){b.textContent='Copy result';},1200);};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,done);}else{var x=document.createElement('textarea');x.value=t;document.body.appendChild(x);x.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(x);done();}};
}
var KW_BTU=3412.14163,KW_KCAL=859.845,KW_TR=3.516853,BAR_PSI=14.5037738,BAR_KG=1.0197162;

/* ---------- Stage B: PT chart, superheat, subcooling (data in ptdata.js, absolute kPa) ---------- */
var PU=[{k:'psi',l:'psig',f:6.894757,d:1},{k:'bar',l:'bar g',f:100,d:2},{k:'kg',l:'kg/cm\u00B2 g',f:98.0665,d:2},{k:'kpa',l:'kPa g',f:1,d:0}],ATM=101.325;
var REFS=[{k:'R32',l:'R32'},{k:'R410A',l:'R410A'},{k:'R22',l:'R22'},{k:'R134a',l:'R134a'}],TUS=[{k:'C',l:'\u00B0C'},{k:'F',l:'\u00B0F'}];
function st(k,d){try{return localStorage.getItem('act_'+k)||d;}catch(e){return d;}}
function sv(k,v){try{localStorage.setItem('act_'+k,v);}catch(e){}}
function puOf(k){return PU.filter(function(u){return u.k===k;})[0]||PU[0];}
function chips(id,items,cur){return '<div class="cchips" id="'+id+'">'+items.map(function(it){return '<button type="button" class="cchip'+(it.k===cur?' on':'')+'" data-k="'+it.k+'">'+it.l+'</button>';}).join('')+'</div>';}
function wire(id,fn){var box=$(id);box.querySelectorAll('.cchip').forEach(function(b){b.onclick=function(){box.querySelectorAll('.cchip').forEach(function(x){x.classList.toggle('on',x===b);});fn(b.getAttribute('data-k'));};});}
function fld(id){return '<div class="cf" id="cf_'+id+'"><label id="lb_'+id+'" for="in_'+id+'"></label><input id="in_'+id+'" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></div>';}
function toC(v,u){return u==='F'?(v-32)/1.8:v;}function fromC(c,u){return u==='F'?c*1.8+32:c;}
function g2a(v,u){return v*u.f+ATM;}function a2g(k,u){return (k-ATM)/u.f;}
function t1(v){return (Math.round(v*10)/10).toFixed(1);}
function head(){return '<p class="calc-note" style="margin:0 0 4px">Refrigerant</p>'+chips('chRef',REFS,st('ref','R32'))+'<p class="calc-note" style="margin:0 0 4px">Pressure unit (gauge)</p>'+chips('chPu',PU,st('pu','psi'))+'<p class="calc-note" style="margin:0 0 4px">Temperature unit</p>'+chips('chTu',TUS,st('tu','C'));}
var ACT='<div class="calc-actions"><button type="button" id="cReset" class="calc-btn">Reset</button><button type="button" id="cCopy" class="calc-btn pri">Copy result</button></div>';
function copyTxt(t){if(!t)return;t+='  (AC Tech Pro)';var b=$('cCopy'),done=function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy result';},1200);};
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,done);}else{var x=document.createElement('textarea');x.value=t;document.body.appendChild(x);x.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(x);done();}}
/* shared chips: refrigerant, pressure unit, temperature unit. Changing a unit converts what is already typed. */
function common(b,o){var S={ref:st('ref','R32'),tu:st('tu','C'),pu:puOf(st('pu','psi'))};
 wire('chRef',function(k){S.ref=k;sv('ref',k);o.recalc();});
 wire('chPu',function(k){var old=S.pu,nu=puOf(k);(o.pIds||[]).forEach(function(id){var v=num($('in_'+id).value);if(v!==null)$('in_'+id).value=a2g(g2a(v,old),nu).toFixed(nu.d);});S.pu=nu;sv('pu',k);o.labels();o.recalc();});
 wire('chTu',function(k){var old=S.tu;(o.tIds||[]).forEach(function(id){var v=num($('in_'+id).value);if(v!==null)$('in_'+id).value=t1(fromC(toC(v,old),k));});
  (o.dIds||[]).forEach(function(id){var v=num($('in_'+id).value);if(v!==null)$('in_'+id).value=t1(old==='C'&&k==='F'?v*1.8:old==='F'&&k==='C'?v/1.8:v);});S.tu=k;sv('tu',k);o.labels();o.recalc();});
 return S;}
var SRC='<p class="calc-note">Data: R22, R410A and R32 from the Daikin/Weitron A1 vs A2L pressure-temperature chart; R134a from NIST REFPROP (Arkema). Different charts can differ by about 0.5 \u00B0F. Always confirm with the unit data plate or service manual. Gauge pressure = absolute \u2212 1.013 bar (gauge zeroed at ambient).</p>';
function ptBuild(b){
 b.innerHTML=head()+fld('p')+fld('t')+ACT+'<p class="calc-note" id="ptMsg"></p><details open class="calc-how"><summary>Pressure-temperature table</summary><div id="ptTab" class="pt-tab"></div></details>'+SRC;
 var src='p',S=common(b,{pIds:['p'],tIds:['t'],labels:labels,recalc:function(){table();calc();}}),rows=[];
 function labels(){$('lb_p').textContent='Pressure ('+S.pu.l+')';$('lb_t').textContent='Saturation temperature (\u00B0'+S.tu+')';}
 function table(){var r=PT.range(S.ref,'dew'),lo=Math.ceil(fromC(r.tmin,S.tu)),hi=Math.floor(fromC(r.tmax,S.tu)),h='';rows=[];
  for(var x=lo;x<=hi;x++){var c=toC(x,S.tu),p=PT.satP(S.ref,c,'dew');if(p===null)continue;rows.push(c);h+='<div class="pt-r"><span>'+x+' \u00B0'+S.tu+'</span><span>'+a2g(p,S.pu).toFixed(S.pu.d)+' '+S.pu.l+'</span></div>';}
  $('ptTab').innerHTML=h;}
 function hl(c){var el=$('ptTab').children,best=-1,d=1e9;for(var i=0;i<rows.length;i++){el[i].classList.remove('hl');var e=Math.abs(rows[i]-c);if(c!==null&&e<d){d=e;best=i;}}
  if(best>=0){el[best].classList.add('hl');var bx=$('ptTab');bx.scrollTop=el[best].offsetTop-bx.clientHeight/2;}}
 function calc(){var m=$('ptMsg');m.textContent='';var r=PT.range(S.ref,'dew');
  if(src==='p'){var v=num($('in_p').value);if(v===null){$('in_t').value='';hl(null);return;}var t=PT.satT(S.ref,g2a(v,S.pu),'dew');
   if(t===null){$('in_t').value='';hl(null);m.textContent='Pressure is outside the table for '+S.ref+' ('+a2g(r.pmin,S.pu).toFixed(S.pu.d)+' to '+a2g(r.pmax,S.pu).toFixed(S.pu.d)+' '+S.pu.l+'). Check the gauge reading and refrigerant.';return;}
   $('in_t').value=t1(fromC(t,S.tu));hl(t);}
  else{var w=num($('in_t').value);if(w===null){$('in_p').value='';hl(null);return;}var c=toC(w,S.tu),p=PT.satP(S.ref,c,'dew');
   if(p===null){$('in_p').value='';hl(null);m.textContent='Temperature is outside the table for '+S.ref+' ('+t1(fromC(r.tmin,S.tu))+' to '+t1(fromC(r.tmax,S.tu))+' \u00B0'+S.tu+').';return;}
   $('in_p').value=a2g(p,S.pu).toFixed(S.pu.d);hl(c);}}
 $('in_p').addEventListener('input',function(){src='p';calc();});$('in_t').addEventListener('input',function(){src='t';calc();});
 $('cReset').onclick=function(){$('in_p').value='';$('in_t').value='';$('ptMsg').textContent='';hl(null);};
 $('cCopy').onclick=function(){var p=$('in_p').value,t=$('in_t').value;copyTxt(p&&t?S.ref+': '+p+' '+S.pu.l+' = '+t+' \u00B0'+S.tu+' saturation':'');};
 labels();table();}
function satBuild(b,cfg){
 b.innerHTML=head()+fld('p')+fld('t')+'<p class="calc-note" style="margin:0 0 4px">Your target range (optional)</p><div class="crow">'+fld('lo')+fld('hi')+'</div><div class="calc-res"><div class="sm">'+cfg.name+'</div><div class="big" id="rB">\u2014</div><div class="sm" id="rS"></div><div class="sm" id="rT"></div><div class="sm" id="rW"></div></div>'+ACT+'<details class="calc-how"><summary>How it is calculated</summary><p>'+cfg.how+'</p></details>'+SRC;
 var S=common(b,{pIds:['p'],tIds:['t'],dIds:['lo','hi'],labels:labels,recalc:calc}),txt='';
 function labels(){$('lb_p').textContent=cfg.pl+' ('+S.pu.l+')';$('lb_t').textContent=cfg.tl+' (\u00B0'+S.tu+')';$('lb_lo').textContent='Target min (\u0394 \u00B0'+S.tu+')';$('lb_hi').textContent='Target max (\u0394 \u00B0'+S.tu+')';}
 function calc(){var p=num($('in_p').value),t=num($('in_t').value),B=$('rB'),s=$('rS'),T=$('rT'),W=$('rW');txt='';s.textContent='';T.textContent='';W.textContent='';B.textContent='\u2014';
  if(p===null||t===null)return;var r=PT.range(S.ref,cfg.kind),ts=PT.satT(S.ref,g2a(p,S.pu),cfg.kind);
  if(ts===null){W.textContent='Pressure is outside the table for '+S.ref+' ('+a2g(r.pmin,S.pu).toFixed(S.pu.d)+' to '+a2g(r.pmax,S.pu).toFixed(S.pu.d)+' '+S.pu.l+'). Check the gauge reading and refrigerant.';return;}
  var d=cfg.calc(toC(t,S.tu),ts),dd=S.tu==='F'?d*1.8:d,ds=t1(dd)+' \u00B0'+S.tu;B.textContent=ds;
  s.textContent=cfg.sat+': '+t1(fromC(ts,S.tu))+' \u00B0'+S.tu;
  var lo=num($('in_lo').value),hi=num($('in_hi').value);
  if(lo!==null||hi!==null){var m=lo!==null&&dd<lo?'Below your target by '+t1(lo-dd)+' \u00B0'+S.tu:hi!==null&&dd>hi?'Above your target by '+t1(dd-hi)+' \u00B0'+S.tu:'Within your target range';T.textContent=m;}
  if(dd<0)W.textContent=cfg.neg;
  txt=S.ref+' '+cfg.name+' '+ds+' ('+cfg.pl+' '+p+' '+S.pu.l+', line '+t+' \u00B0'+S.tu+', saturation '+t1(fromC(ts,S.tu))+' \u00B0'+S.tu+')';}
 ['p','t','lo','hi'].forEach(function(id){$('in_'+id).addEventListener('input',calc);});
 $('cReset').onclick=function(){['p','t','lo','hi'].forEach(function(id){$('in_'+id).value='';});calc();};
 $('cCopy').onclick=function(){copyTxt(txt);};
 labels();calc();}
var SH={name:'Superheat',pl:'Suction pressure',tl:'Suction line temperature',kind:'dew',sat:'Saturation (dew) temperature',calc:function(tl,ts){return tl-ts;},neg:'Negative value: check the gauge reading and sensor contact. Liquid refrigerant may be reaching the compressor.',how:'Superheat = suction line temperature \u2212 saturation temperature at the suction pressure (dew point). The saturation temperature is read from the pressure-temperature data of the selected refrigerant.'};
var SC={name:'Subcooling',pl:'Liquid line pressure',tl:'Liquid line temperature',kind:'bub',sat:'Saturation (bubble) temperature',calc:function(tl,ts){return ts-tl;},neg:'Negative value: check the gauge reading and sensor contact. The liquid line should be at or below saturation temperature.',how:'Subcooling = saturation temperature at the liquid line (high side) pressure \u2212 liquid line temperature (bubble point). Use the high side gauge and a clamp thermometer on the liquid line.'};
/* ---------- Stage C: electrical power, cable size and MCB, AC running cost ---------- */
function lf(id,label,val){return '<div class="cf" id="cf_'+id+'"><label id="lb_'+id+'" for="in_'+id+'">'+label+'</label><input id="in_'+id+'" type="text" inputmode="decimal" autocomplete="off" placeholder="0"'+(val?' value="'+val+'"':'')+'></div>';}
function rbox(name){return '<div class="calc-res"><div class="sm">'+name+'</div><div class="big" id="rB">\u2014</div><div class="sm" id="r1"></div><div class="sm" id="r2"></div><div class="sm" id="r3"></div><div class="sm" id="r4"></div><div class="sm" id="rW"></div></div>';}
function R(big,ln,w){$('rB').textContent=big;for(var i=1;i<=4;i++)$('r'+i).textContent=(ln&&ln[i-1])||'';$('rW').textContent=w||'';}
function inr(v){var r=Math.round(v);try{return r.toLocaleString('en-IN');}catch(e){return String(r);}}
function rs(v){return '\u20B9'+inr(v);}
function lab(t){return '<p class="calc-note" style="margin:0 0 4px">'+t+'</p>';}
function show(id,on){$('cf_'+id).style.display=on?'':'none';}
var PHS=[{k:'1',l:'Single phase'},{k:'3',l:'Three phase'}],S3=Math.sqrt(3);
function dfV(p){return p==='3'?'415':'230';}
function onIn(ids,fn){ids.forEach(function(id){$('in_'+id).addEventListener('input',fn);});}

/* 1) Power: type amps to get kW, or type kW to get amps */
function powerBuild(b){
 var ph=st('ph','1'),src='a',txt='';
 b.innerHTML=lab('Supply')+chips('chPh',PHS,ph)+lf('v','Voltage (V)',dfV(ph))+lf('pf','Power factor (PF)','0.85')+lf('a','Current (A)')+lf('kw','Real power (kW)')+rbox('Result')+ACT+'<p class="calc-note">Type <b>current</b> to get kW, or type <b>kW</b> to get current. The other box fills itself. Three phase assumes a balanced load and line to line voltage.</p><details class="calc-how"><summary>How it is calculated</summary><p>Single phase: kW = V \u00D7 A \u00D7 PF \u00F7 1000.<br>Three phase: kW = \u221A3 \u00D7 V \u00D7 A \u00D7 PF \u00F7 1000.<br>kVA = V \u00D7 A \u00F7 1000 (\u00D7 \u221A3 for three phase). Check the PF on the data plate.</p></details>';
 function labels(){$('lb_v').textContent=ph==='3'?'Voltage (V), line to line':'Voltage (V)';}
 function run(){var V=num($('in_v').value),pf=num($('in_pf').value),k=ph==='3'?S3:1,A,KW;txt='';
  $('cf_a').classList.toggle('src',src==='a');$('cf_kw').classList.toggle('src',src==='kw');
  var o=src==='a'?'kw':'a',s=num($('in_'+src).value);
  if(s===null||V===null||V<=0||pf===null){if(s===null)$('in_'+o).value='';R('\u2014');return;}
  if(pf<=0||pf>1){R('\u2014',[],'Power factor must be between 0 and 1, for example 0.85.');return;}
  if(src==='a'){A=s;KW=k*V*A*pf/1000;$('in_kw').value=fmt(KW);}else{KW=s;A=KW*1000/(k*V*pf);$('in_a').value=fmt(A);}
  var KVA=k*V*A/1000,KR=Math.sqrt(Math.max(0,KVA*KVA-KW*KW));
  R(src==='a'?fmt(KW)+' kW':fmt(A)+' A',['Apparent power: '+fmt(KVA)+' kVA','Real power: '+fmt(KW)+' kW','Current: '+fmt(A)+' A','Reactive power: '+fmt(KR)+' kVAR']);
  txt=(ph==='3'?'3-phase ':'1-phase ')+fmt(V)+' V, PF '+fmt(pf)+': '+fmt(A)+' A = '+fmt(KW)+' kW = '+fmt(KVA)+' kVA';}
 wire('chPh',function(k){var f=$('in_v');if(num(f.value)===null||f.value===dfV(ph))f.value=dfV(k);ph=k;sv('ph',k);labels();run();});
 $('in_a').addEventListener('input',function(){src='a';run();});
 $('in_kw').addEventListener('input',function(){src='kw';run();});
 onIn(['v','pf'],run);
 $('cReset').onclick=function(){$('in_a').value='';$('in_kw').value='';$('in_v').value=dfV(ph);$('in_pf').value='0.85';src='a';run();};
 $('cCopy').onclick=function(){copyTxt(txt);};
 labels();run();}

/* 2) Cable size and MCB. Table: [mm2, amps with 2 loaded cores, amps with 3 loaded cores], PVC insulated, in conduit (IEC 60364 method B1, 30 C) */
var CU=[[1.5,15.5,13.5],[2.5,21,18],[4,28,24],[6,36,31],[10,50,42],[16,68,56],[25,89,73],[35,110,89],[50,134,108],[70,171,136],[95,207,164]];
var AL=[[16,53,43],[25,70,57],[35,86,70],[50,104,84],[70,133,107],[95,161,129]];
var RHO={Cu:0.0225,Al:0.036},MCBS=[6,10,16,20,25,32,40,50,63,80,100,125],VDMAX=3;
var MATS=[{k:'Cu',l:'Copper'},{k:'Al',l:'Aluminium'}],LMS=[{k:'kw',l:'Load in kW'},{k:'a',l:'Load in amps'}];
function cableBuild(b){
 var ph=st('ph','1'),mat=st('mat','Cu'),lm=st('lm','kw'),txt='';
 b.innerHTML=lab('Supply')+chips('chPh',PHS,ph)+lab('Conductor')+chips('chMat',MATS,mat)+lab('Load entered as')+chips('chLm',LMS,lm)+lf('ld','Load')+lf('v','Voltage (V)',dfV(ph))+lf('pf','Power factor (PF)','0.85')+lf('len','Cable run length (m)')+rbox('Cable and MCB')+ACT+'<p class="calc-note">Guide only. Check your local wiring code and the AC data plate (use its MCA / max fuse rating if given). Cable length is one way, from the MCB to the AC.</p><details class="calc-how"><summary>How it is calculated</summary><p>MCB = next standard size above 125% of the running current.<br>Cable = smallest size whose current rating is at least the MCB rating (PVC insulated, in conduit, 30 \u00B0C, 2 loaded cores for single phase, 3 for three phase).<br>Voltage drop = 2 \u00D7 I \u00D7 L \u00D7 \u03C1 \u00F7 A (single phase) or \u221A3 \u00D7 I \u00D7 L \u00D7 \u03C1 \u00F7 A (three phase), using resistance only, so it is slightly on the safe side. If it is above 3%, the next bigger cable is picked.</p></details>';
 function labels(){$('lb_ld').textContent=lm==='kw'?'Load (kW)':'Load (A)';$('lb_v').textContent=ph==='3'?'Voltage (V), line to line':'Voltage (V)';show('pf',lm==='kw');}
 function calc(){txt='';var L=num($('in_len').value),V=num($('in_v').value),pf=num($('in_pf').value),ld=num($('in_ld').value),k=ph==='3'?S3:1,I,i;
  if(ld===null||ld<=0||V===null||V<=0){R('\u2014');return;}
  if(lm==='kw'){if(pf===null||pf<=0||pf>1){R('\u2014',[],'Power factor must be between 0 and 1, for example 0.85.');return;}I=ld*1000/(k*V*pf);}else I=ld;
  var need=I*1.25,mcb=0;for(i=0;i<MCBS.length;i++){if(MCBS[i]>=need){mcb=MCBS[i];break;}}
  if(!mcb){R('\u2014',['Running current: '+fmt(I)+' A'],'Above the 125 A MCB range. Use an MCCB and a proper cable design.');return;}
  var T=mat==='Cu'?CU:AL,col=ph==='3'?2:1,idx=-1;for(i=0;i<T.length;i++){if(T[i][col]>=mcb){idx=i;break;}}
  if(idx<0){R('\u2014',['Running current: '+fmt(I)+' A','MCB: '+mcb+' A'],'Needs a cable above 95 mm\u00B2 or parallel runs. Do a proper design.');return;}
  var kv=ph==='3'?S3:2,base=T[idx][0],bumped=false,vd=null;
  function drop(j){return kv*I*L*RHO[mat]/T[j][0];}
  if(L!==null&&L>0){while(drop(idx)/V*100>VDMAX&&idx<T.length-1){idx++;bumped=true;}vd=drop(idx);}
  var sz=T[idx][0],pc=vd===null?null:vd/V*100;
  R(fmt(sz)+' mm\u00B2 '+mat,['Running current: '+fmt(I)+' A','MCB: '+mcb+' A (next standard size above 125% of running current)',vd===null?'Enter the cable run length to check voltage drop.':'Voltage drop: '+t1(pc)+' % ('+t1(vd)+' V) over '+fmt(L)+' m',bumped?'Size increased from '+fmt(base)+' mm\u00B2 to keep voltage drop within '+VDMAX+' %.':''],
   pc!==null&&pc>VDMAX?'Voltage drop is still above '+VDMAX+' % with the largest size in the table. Shorten the run or use parallel cables.':'');
  txt=fmt(I)+' A: cable '+fmt(sz)+' mm\u00B2 '+mat+', MCB '+mcb+' A'+(pc!==null?', voltage drop '+t1(pc)+' % over '+fmt(L)+' m':'');}
 wire('chPh',function(k){var f=$('in_v');if(num(f.value)===null||f.value===dfV(ph))f.value=dfV(k);ph=k;sv('ph',k);labels();calc();});
 wire('chMat',function(k){mat=k;sv('mat',k);calc();});
 wire('chLm',function(k){lm=k;sv('lm',k);$('in_ld').value='';labels();calc();});
 onIn(['ld','v','pf','len'],calc);
 $('cReset').onclick=function(){$('in_ld').value='';$('in_len').value='';$('in_v').value=dfV(ph);$('in_pf').value='0.85';calc();};
 $('cCopy').onclick=function(){copyTxt(txt);};
 labels();calc();}

/* 3) AC running cost. Tariff has no default on purpose, it changes. */
var PMS=[{k:'kw',l:'Power in kW'},{k:'tr',l:'Cooling in TR'}];
function costBuild(b){
 var pm=st('pm','kw'),txt='';
 b.innerHTML=lab('Enter the AC as')+chips('chPm',PMS,pm)+lf('p','Power')+lf('cop','COP (cooling kW \u00F7 electrical kW)')+lf('hr','Running hours per day')+lf('dy','Days per month','30')+lf('ldf','Average load (%)','100')+lf('tf','Tariff (\u20B9 per unit)')+rbox('Running cost')+ACT+'<p class="calc-note">Use the electrical input power from the data plate. An inverter AC rarely runs at full load, so try 60 to 70 % for average load. In TR mode, electrical kW = TR \u00D7 3.517 \u00F7 COP (COP = EER \u00F7 3.412).</p><details class="calc-how"><summary>How it is calculated</summary><p>Units (kWh) = kW \u00D7 load % \u00D7 hours per day \u00D7 days. Cost = units \u00D7 tariff. Year cost = month cost \u00D7 12. Fixed charges and taxes on your bill are not included.</p></details>';
 function labels(){$('lb_p').textContent=pm==='kw'?'AC power drawn (kW)':'AC cooling capacity (TR)';show('cop',pm==='tr');}
 function calc(){txt='';var p=num($('in_p').value),cop=num($('in_cop').value),hr=num($('in_hr').value),dy=num($('in_dy').value),lo=num($('in_ldf').value),tf=num($('in_tf').value),kw;
  if(p===null||p<=0||hr===null||dy===null||lo===null){R('\u2014');return;}
  if(hr>24||dy>31||lo<=0||lo>100){R('\u2014',[],'Check the values: hours up to 24, days up to 31, load 1 to 100 %.');return;}
  if(pm==='tr'){if(cop===null||cop<=0){R('\u2014',[],'Enter the COP to convert TR to electrical kW.');return;}kw=p*KW_TR/cop;}else kw=p;
  var avg=kw*lo/100,ud=avg*hr,um=ud*dy;
  if(tf===null||tf<0){R(fmt(um)+' units / month',['Units per day: '+fmt(ud),'Units per month: '+fmt(um),'Average power used: '+fmt(avg)+' kW','Enter the tariff (\u20B9 per unit) to see the cost.']);txt=fmt(um)+' units per month ('+fmt(avg)+' kW, '+fmt(hr)+' h/day, '+fmt(dy)+' days)';return;}
  var cd=ud*tf,cm=um*tf;
  R(rs(cm)+' / month',['Cost per day: '+rs(cd),'Cost per year: '+rs(cm*12),'Units: '+fmt(ud)+' per day, '+fmt(um)+' per month','Average power used: '+fmt(avg)+' kW']);
  txt=rs(cm)+' per month, '+fmt(um)+' units at '+rs(tf)+' per unit ('+fmt(avg)+' kW, '+fmt(hr)+' h/day, '+fmt(dy)+' days)';}
 wire('chPm',function(k){pm=k;sv('pm',k);$('in_p').value='';labels();calc();});
 onIn(['p','cop','hr','dy','ldf','tf'],calc);
 $('cReset').onclick=function(){['p','cop','hr','tf'].forEach(function(id){$('in_'+id).value='';});$('in_dy').value='30';$('in_ldf').value='100';calc();};
 $('cCopy').onclick=function(){copyTxt(txt);};
 labels();calc();}

var CALCS=[
{id:'trbtu',g:'Capacity and Airflow',n:'TR · BTU/h · kW',d:'Convert cooling capacity',ic:'snow',kw:'ton refrigeration btu kilowatt kcal capacity tonnage',build:function(b){linked(b,{chips:[0.75,1,1.5,2,2.5,3,4,5],chipUnit:'TR',fields:[
 {id:'tr',label:'Tons of refrigeration (TR)',unit:'TR',toBase:function(v){return v*KW_TR;},fromBase:function(k){return k/KW_TR;}},
 {id:'btu',label:'BTU per hour (BTU/h)',unit:'BTU/h',toBase:function(v){return v/KW_BTU;},fromBase:function(k){return k*KW_BTU;}},
 {id:'kw',label:'Kilowatt (kW) cooling capacity',unit:'kW',toBase:function(v){return v;},fromBase:function(k){return k;}},
 {id:'kcal',label:'Kilocalorie per hour (kcal/h)',unit:'kcal/h',toBase:function(v){return v/KW_KCAL;},fromBase:function(k){return k*KW_KCAL;}}],
 note:'kW here is <b>cooling capacity</b>, not the electrical power the AC draws from the supply.',
 how:'<p>1 TR = 12,000 BTU/h = 3.517 kW = 3,024 kcal/h.<br>1 kW = 3,412 BTU/h = 860 kcal/h.</p>'});}},
{id:'deltat',g:'Capacity and Airflow',n:'Delta-T and CFM',d:'Air-side check, CFM to CMH',ic:'wind',soon:1},
{id:'ptchart',g:'Refrigerant',n:'Pressure-temperature chart',d:'R32, R410A, R22, R134a',ic:'gauge',kw:'pt chart saturation r32 r410a r22 r134a',build:ptBuild},
{id:'pressure',g:'Refrigerant',n:'Pressure converter',d:'psi · bar · kg/cm² · kPa · MPa',ic:'gauge',kw:'psi bar kg/cm2 kpa mpa gauge pressure convert',build:function(b){linked(b,{fields:[
 {id:'psi',label:'psi',unit:'psi',toBase:function(v){return v/BAR_PSI;},fromBase:function(k){return k*BAR_PSI;}},
 {id:'bar',label:'bar',unit:'bar',toBase:function(v){return v;},fromBase:function(k){return k;}},
 {id:'kg',label:'kg/cm²',unit:'kg/cm²',toBase:function(v){return v/BAR_KG;},fromBase:function(k){return k*BAR_KG;}},
 {id:'kpa',label:'kPa',unit:'kPa',toBase:function(v){return v/100;},fromBase:function(k){return k*100;}},
 {id:'mpa',label:'MPa',unit:'MPa',toBase:function(v){return v*10;},fromBase:function(k){return k/10;}}],
 note:'This only changes units. Gauge pressure (psig) and absolute pressure are different: absolute = gauge + about 1.013 bar at sea level.',
 how:'<p>1 bar = 14.504 psi = 1.0197 kg/cm² = 100 kPa = 0.1 MPa.</p>'});}},
{id:'superheat',g:'Refrigerant',n:'Superheat',d:'Suction line check',ic:'therm',kw:'superheat suction',build:function(b){satBuild(b,SH);}},
{id:'subcool',g:'Refrigerant',n:'Subcooling',d:'Liquid line check',ic:'therm',kw:'subcooling liquid',build:function(b){satBuild(b,SC);}},
{id:'power',g:'Electrical',n:'Power: 1-phase and 3-phase',d:'kW, kVA, amps',ic:'bolt',kw:'power kw kva amps volts current phase electrical',build:powerBuild},
{id:'cable',g:'Electrical',n:'Cable size and MCB',d:'Cable, MCB, voltage drop',ic:'cable',kw:'cable wire size mcb breaker voltage drop mm2',build:cableBuild},
{id:'cost',g:'Electrical',n:'AC running cost',d:'Units and cost per month',ic:'coin',kw:'cost bill units tariff electricity running rupees',build:costBuild}];
function card(c){var b=document.createElement('button');b.type='button';b.className='calc-card'+(c.soon?' soon':'');b.disabled=!!c.soon;
 b.innerHTML='<span class="calc-ic"><svg viewBox="0 0 24 24" aria-hidden="true">'+IC[c.ic]+'</svg></span><span class="calc-tx"><b>'+c.n+'</b><small>'+c.d+'</small></span>'+(c.soon?'<span class="calc-tag">Soon</span>':'');
 if(!c.soon)b.onclick=function(){openCalc(c);};return b;}
function list(q){var box=$('calcGroups');box.innerHTML='';q=(q||'').toLowerCase().trim();var last='',n=0;
 CALCS.forEach(function(c){if(q&&(c.n+' '+c.d+' '+(c.kw||'')).toLowerCase().indexOf(q)<0)return;
  if(c.g!==last){var h=document.createElement('div');h.className='calc-group';h.textContent=c.g;box.appendChild(h);last=c.g;}box.appendChild(card(c));n++;});
 if(!n){var p=document.createElement('p');p.className='calc-note';p.textContent='No calculator found.';box.appendChild(p);}}
function openCalc(c){$('calcList').hidden=true;$('calcView').hidden=false;$('calcTitle').textContent=c.n;c.build($('calcBody'));window.scrollTo(0,0);}
window.calcBack=function(){if($('calcView').hidden)return false;$('calcView').hidden=true;$('calcList').hidden=false;$('calcBody').innerHTML='';document.body.classList.remove('typing');window.scrollTo(0,0);return true;};
$('calcBack').onclick=window.calcBack;
$('calcSearch').addEventListener('input',function(){list(this.value);});
document.addEventListener('focusin',function(e){if(e.target.closest&&e.target.closest('#tabCalc')&&e.target.tagName==='INPUT')document.body.classList.add('typing');});
document.addEventListener('focusout',function(e){if(e.target.closest&&e.target.closest('#tabCalc'))document.body.classList.remove('typing');});
list('');
})();
