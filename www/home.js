/* AC Tech Pro: Home tab (opening labels, refrigerant cycle sequence, offline) */
(function(){
var NS='http://www.w3.org/2000/svg',$=function(i){return document.getElementById(i);},stage=$('stage'),ct=0;
function E(t,a,p){var n=document.createElementNS(NS,t);for(var k in a)n.setAttribute(k,a[k]);if(p)p.appendChild(n);return n;}
/* labels: name, short description, centre x, centre y, border colour (image coordinates 1024x1536) */
var L=[['Indoor Unit (Evaporator)','High-wall type',450,200,'#38bdf8'],['Blower','Pulls room air through coil',170,290,'#38bdf8'],['Evaporator Coil','Absorbs room heat',560,400,'#38bdf8'],['Cool Air to Room','',330,650,'#38bdf8'],['Remote','Tap to switch AC on',840,120,'#ff9500'],
['Liquid Line','Warm liquid \u2192 to indoor unit',515,715,'#ff9500'],['Suction Line','Low-pressure vapour \u2192 compressor',485,805,'#38bdf8'],['Outdoor Unit (Condenser)','',300,880,'#38bdf8'],
['Condenser Coil','Heat released outside; vapour \u2192 liquid',330,985,'#ff9500'],['Condenser Fan','Blows outside air over coil',290,1110,'#38bdf8'],['Compressor','Raises pressure & heat',700,1070,'#ff3b30'],['Expansion Valve','Pressure drops, liquid turns cold',620,1235,'#ffd60a']];
var pic=$('pic');
function fit(){var w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;var pw=Math.min(w,h*2/3),ph=pw*1.5;pic.style.cssText='width:'+pw+'px;height:'+ph+'px;left:'+(w-pw)/2+'px;top:'+(h-ph)/2+'px';}
if(window.ResizeObserver)new ResizeObserver(fit).observe(stage);window.addEventListener('resize',fit);fit();
var g=$('lb');
L.forEach(function(a){var w=Math.max(a[0].length*19,a[1].length*14.5)+40,h=a[1]?78:48,x=Math.min(Math.max(a[2]-w/2,8),1016-w),y=a[3]-h/2;
E('rect',{x:x,y:y,width:w,height:h,rx:16,fill:'#031528','fill-opacity':.92,stroke:a[4],'stroke-width':3},g);
var t=E('text',{x:x+w/2,y:a[1]?y+34:y+32,'text-anchor':'middle','font-size':34,'font-weight':700,fill:'#fff'},g);t.textContent=a[0];
if(a[1]){var d=E('text',{x:x+w/2,y:y+64,'text-anchor':'middle','font-size':26,fill:'#cfe8ff'},g);d.textContent=a[1];}});
/* fan / blower motion-blur discs */
function disc(id,r){var p=$(id),s=E('g',{'class':'sp'},p);E('circle',{r:r,fill:'#fff','fill-opacity':.14},s);
[[0,50],[110,135],[200,265]].forEach(function(w){var a=w[0]*Math.PI/180,b=w[1]*Math.PI/180;
E('path',{d:'M0 0L'+r*Math.cos(a)+' '+r*Math.sin(a)+'A'+r+' '+r+' 0 '+(w[1]-w[0]>180?1:0)+' 1 '+r*Math.cos(b)+' '+r*Math.sin(b)+'Z',fill:'#fff','fill-opacity':.24},s);});}
disc('fdA',170);disc('fdB',178);disc('fdC',72);
/* sequence (seconds): indoor blower + plain air first > outdoor fan + compressor > condenser > valve > liquid line up > evaporator cools + suction line > cold breeze with mist > closed view */
var S=[[0,'ind'],[0,'bl'],[4,'fo'],[4,'gcp'],[5.5,'gco'],[7,'gva'],[8,'l1'],[11,'gev'],[11,'l2'],[14,'air'],[15.5,'ext'],[21,'soft']];
var playing=false,t=0,last=0,raf=0,done=[],ot=0,busy=false;
function tick(n){if(!playing)return;t+=Math.min((n-last)/1000,.1);last=n;
S.forEach(function(e,i){if(!done[i]&&t>=e[0]){done[i]=1;stage.classList.add(e[1]);}});raf=requestAnimationFrame(tick);}
var AC=null;
function beep(n,long){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();var t0=AC.currentTime;for(var i=0;i<n;i++){var s=t0+i*.2,o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=2200;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(.25,s+.01);g.gain.exponentialRampToValueAtTime(.001,s+(long?.45:.12));o.connect(g);g.connect(AC.destination);o.start(s);o.stop(s+(long?.5:.15));}}catch(e){}}
function on(){playing=true;stage.classList.add('started','run','acon');last=performance.now();raf=requestAnimationFrame(tick);}
function reset(){cancelAnimationFrame(raf);t=0;done=[];stage.className=stage.classList.contains('rmopen')?'rmopen':'';busy=false;}
function off(){playing=false;stage.classList.remove('run','acon');clearTimeout(ot);if(stage.classList.contains('ext')){stage.classList.add('dispoff');ot=setTimeout(reset,1300);}else reset();}
/* remote: small at the top-right; tap = enlarge to the centre; orange button = AC on/off, then it shrinks back */
function openRm(){stage.classList.add('rmopen');clearTimeout(ct);ct=setTimeout(closeRm,7000);}
function closeRm(){stage.classList.remove('rmopen');clearTimeout(ct);}
$('rmHit').onclick=openRm;$('rmBack').onclick=closeRm;
$('rmPw').onclick=function(){if(busy)return;busy=true;if(playing){beep(1,true);off();}else{beep(2,false);on();setTimeout(function(){busy=false;},900);}setTimeout(closeRm,700);};
window.homeStop=function(){clearTimeout(ot);playing=false;stage.classList.remove('run','acon');reset();closeRm();};
document.addEventListener('visibilitychange',function(){if(document.hidden)window.homeStop();});
})();
