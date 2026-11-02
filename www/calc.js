/* AC Tech Pro: HVAC Calculators (offline, no libraries). Stage A: TR/BTU/kW and pressure converter. */
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
var CALCS=[
{id:'trbtu',g:'Capacity and Airflow',n:'TR · BTU/h · kW',d:'Convert cooling capacity',ic:'snow',kw:'ton refrigeration btu kilowatt kcal capacity tonnage',build:function(b){linked(b,{chips:[0.75,1,1.5,2,2.5,3,4,5],chipUnit:'TR',fields:[
 {id:'tr',label:'Tons of refrigeration (TR)',unit:'TR',toBase:function(v){return v*KW_TR;},fromBase:function(k){return k/KW_TR;}},
 {id:'btu',label:'BTU per hour (BTU/h)',unit:'BTU/h',toBase:function(v){return v/KW_BTU;},fromBase:function(k){return k*KW_BTU;}},
 {id:'kw',label:'Kilowatt (kW) cooling capacity',unit:'kW',toBase:function(v){return v;},fromBase:function(k){return k;}},
 {id:'kcal',label:'Kilocalorie per hour (kcal/h)',unit:'kcal/h',toBase:function(v){return v/KW_KCAL;},fromBase:function(k){return k*KW_KCAL;}}],
 note:'kW here is <b>cooling capacity</b>, not the electrical power the AC draws from the supply.',
 how:'<p>1 TR = 12,000 BTU/h = 3.517 kW = 3,024 kcal/h.<br>1 kW = 3,412 BTU/h = 860 kcal/h.</p>'});}},
{id:'deltat',g:'Capacity and Airflow',n:'Delta-T and CFM',d:'Air-side check, CFM to CMH',ic:'wind',soon:1},
{id:'ptchart',g:'Refrigerant',n:'Pressure-temperature chart',d:'R32, R410A, R22, R134a',ic:'gauge',soon:1},
{id:'pressure',g:'Refrigerant',n:'Pressure converter',d:'psi · bar · kg/cm² · kPa · MPa',ic:'gauge',kw:'psi bar kg/cm2 kpa mpa gauge pressure convert',build:function(b){linked(b,{fields:[
 {id:'psi',label:'psi',unit:'psi',toBase:function(v){return v/BAR_PSI;},fromBase:function(k){return k*BAR_PSI;}},
 {id:'bar',label:'bar',unit:'bar',toBase:function(v){return v;},fromBase:function(k){return k;}},
 {id:'kg',label:'kg/cm²',unit:'kg/cm²',toBase:function(v){return v/BAR_KG;},fromBase:function(k){return k*BAR_KG;}},
 {id:'kpa',label:'kPa',unit:'kPa',toBase:function(v){return v/100;},fromBase:function(k){return k*100;}},
 {id:'mpa',label:'MPa',unit:'MPa',toBase:function(v){return v*10;},fromBase:function(k){return k/10;}}],
 note:'This only changes units. Gauge pressure (psig) and absolute pressure are different: absolute = gauge + about 1.013 bar at sea level.',
 how:'<p>1 bar = 14.504 psi = 1.0197 kg/cm² = 100 kPa = 0.1 MPa.</p>'});}},
{id:'superheat',g:'Refrigerant',n:'Superheat',d:'Suction line check',ic:'therm',soon:1},
{id:'subcool',g:'Refrigerant',n:'Subcooling',d:'Liquid line check',ic:'therm',soon:1},
{id:'power',g:'Electrical',n:'Power: 1-phase and 3-phase',d:'kW, kVA, amps',ic:'bolt',soon:1},
{id:'cable',g:'Electrical',n:'Cable size and MCB',d:'Cable, MCB, voltage drop',ic:'cable',soon:1},
{id:'cost',g:'Electrical',n:'AC running cost',d:'Units and cost per month',ic:'coin',soon:1}];
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
