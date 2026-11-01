/* AC Tech Pro: Home tab animation (offline, no libraries) */
(function(){
var svg=document.getElementById('acSvg'),pp=document.getElementById('homePlay'),rs=document.getElementById('homeRestart'),NS='http://www.w3.org/2000/svg';
var L=[['Evaporator Coil',131,50],['Blower',250,49],['INDOOR UNIT',180,122],['Cold Liquid',272,150],['Expansion Valve',250,222],['Warm Liquid',275,290],['Cold Gas',74,260],['OUTDOOR UNIT',180,346],['Compressor',88,413],['Hot Gas',136,546],['Condenser Coil',192,462],['Condenser Fan',274,526]];
var g=document.getElementById('lb');
L.forEach(function(a){var w=a[0].length*6+12,r=document.createElementNS(NS,'rect'),t=document.createElementNS(NS,'text');
r.setAttribute('x',a[1]-w/2);r.setAttribute('y',a[2]-10);r.setAttribute('width',w);r.setAttribute('height',20);r.setAttribute('rx',8);r.setAttribute('fill','#062a33');r.setAttribute('stroke','#22d3ee');
t.setAttribute('x',a[1]);t.setAttribute('y',a[2]+4);t.setAttribute('text-anchor','middle');t.setAttribute('font-size','11');t.setAttribute('fill','#e6faff');t.setAttribute('font-weight','700');t.textContent=a[0];
g.appendChild(r);g.appendChild(t);});
function on(id){return function(){document.getElementById(id).classList.add('on');};}
var ev=[[0,on('f1')],[.5,on('f2')],[2,on('f3')],[3.2,on('vp')],[3.6,on('f4')],[4.6,on('ev')],[5.4,on('f5')],[8.4,function(){svg.classList.add('s2');}],[12.5,function(){svg.classList.add('soft');}]];
var playing=false,t=0,last=0,raf=0,done=[];
function tick(n){if(!playing)return;var dt=Math.min((n-last)/1000,.1);last=n;t+=dt;
ev.forEach(function(e,i){if(!done[i]&&t>=e[0]){done[i]=1;e[1]();}});raf=requestAnimationFrame(tick);}
function play(){playing=true;svg.classList.add('p');pp.textContent='❚❚ Pause';last=performance.now();raf=requestAnimationFrame(tick);}
function pause(){playing=false;cancelAnimationFrame(raf);svg.classList.remove('p');pp.textContent='▶ Play';}
pp.onclick=function(){playing?pause():play();};
rs.onclick=function(){pause();t=0;done=[];svg.classList.remove('p','s2','soft');
['f1','f2','f3','f4','f5','vp','ev'].forEach(function(id){document.getElementById(id).classList.remove('on');});};
window.homeStop=function(){if(playing)pause();};
document.addEventListener('visibilitychange',function(){if(document.hidden&&playing)pause();});
})();
