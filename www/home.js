/* AC Tech Pro: Home tab (opening labels, refrigerant cycle sequence, offline) */
(function(){
var NS='http://www.w3.org/2000/svg',$=function(i){return document.getElementById(i);},stage=$('stage'),pp=$('homePlay'),rs=$('homeRestart');
function E(t,a,p){var n=document.createElementNS(NS,t);for(var k in a)n.setAttribute(k,a[k]);if(p)p.appendChild(n);return n;}
/* labels: name, short description, centre x, centre y, border colour (image coordinates 1024x1536) */
var L=[['Indoor Unit (Evaporator)','High-wall type',450,200,'#38bdf8'],['Blower','Pulls room air through coil',170,290,'#38bdf8'],['Evaporator Coil','Absorbs room heat',560,400,'#38bdf8'],['Cool Air to Room','',330,650,'#38bdf8'],
['Liquid Line','Warm liquid \u2192 to indoor unit',640,715,'#ff9500'],['Suction Line','Low-pressure vapour \u2192 compressor',640,805,'#38bdf8'],['Outdoor Unit (Condenser)','',300,880,'#38bdf8'],
['Condenser Coil','Heat released outside; vapour \u2192 liquid',330,985,'#ff9500'],['Condenser Fan','Blows outside air over coil',290,1110,'#38bdf8'],['Compressor','Raises pressure & heat',700,1070,'#ff3b30'],['Expansion Valve','Pressure drops, liquid turns cold',620,1235,'#ffd60a']];
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
/* sequence (seconds of running time): compressor > condenser + outdoor fan > valve > liquid line up > evaporator + blower > suction line down > breeze > closed view */
var S=[[.3,'gcp'],[2.5,'gco'],[2.5,'fo'],[4.5,'gva'],[5.5,'l1'],[9,'gev'],[9,'bl'],[11,'l2'],[14,'air'],[15.5,'ext'],[21,'soft']];
var playing=false,t=0,last=0,raf=0,done=[];
function tick(n){if(!playing)return;t+=Math.min((n-last)/1000,.1);last=n;
S.forEach(function(e,i){if(!done[i]&&t>=e[0]){done[i]=1;stage.classList.add(e[1]);}});raf=requestAnimationFrame(tick);}
function play(){playing=true;stage.classList.add('started','run');pp.textContent='\u275A\u275A Pause';last=performance.now();raf=requestAnimationFrame(tick);}
function pause(){playing=false;cancelAnimationFrame(raf);stage.classList.remove('run');pp.textContent='\u25B6 Play';}
pp.onclick=function(){playing?pause():play();};
rs.onclick=function(){pause();t=0;done=[];stage.className='';};
window.homeStop=function(){if(playing)pause();};
document.addEventListener('visibilitychange',function(){if(document.hidden&&playing)pause();});
})();
