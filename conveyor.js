/* Engineering-style concept drawing of the planned direct-loading conveyor. Not to scale. */
(()=>{
const host=document.querySelector('.conveyor-canvas');
if(!host)return;
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const copy=k=>window.JGI_COPY[k][language]||window.JGI_COPY[k].en;
const i18n=k=>'<tspan data-i18n="'+k+'">'+copy(k)+'</tspan>';
const HOLDS=[0,1,2,3,4,5].map(i=>671+i*52);
const seabed=x=>x<150?380:380+130*Math.pow((x-150)/1050,.7);
const range=(a,b,s)=>{const o=[];for(let x=a;x<=b;x+=s)o.push(x);return o};
/* d = drawn line with a stagger delay in seconds */
const d=(path,cls,t)=>'<path class="dl '+cls+'" style="--t:'+t+'s" d="'+path+'"/>';
const shape=(tag,attrs,cls,t)=>'<'+tag+' class="dl '+cls+'" style="--t:'+t+'s" '+attrs+'/>';
const zig=(a,b,y1,y2,s)=>range(a,b,s).map((x,i)=>(i?'L':'M')+x+' '+(i%2?y1:y2)).join('');
const ticks=(a,b,y1,y2,s)=>range(a,b,s).map(x=>'M'+x+' '+y1+'V'+y2).join('');
const cross=(x,y,w,h)=>'M'+x+' '+y+'l'+w+' '+h+'M'+(x+w)+' '+y+'l'+(-w)+' '+h;
const balloon=(n,x,y,tx,ty)=>'<g class="fd" style="--t:'+(1.7+n*.07)+'s"><path class="cv-lead" d="M'+x+' '+y+'L'+tx+' '+ty+'"/><circle class="cv-balloon" cx="'+x+'" cy="'+y+'" r="12"/><text class="cv-num" x="'+x+'" y="'+(y+4.5)+'" text-anchor="middle">'+n+'</text></g>';
const seabedPath=range(0,1200,20).map((x,i)=>(i?'L':'M')+x+' '+seabed(x).toFixed(1)).join('');
const DEPTHS=[[300,'-6/-8'],[470,'-10'],[600,'-15'],[730,'-16'],[860,'-18'],[990,'-18'],[1125,'-30+']];

const plan=
  /* coast */
  d('M132 0C150 40 128 90 138 150C146 200 132 240 142 285','cv-line',0)+
  d('M152 0C170 40 148 90 158 150C166 200 152 240 162 285','cv-thin',.1)+
  /* depth contours */
  [405,535,665,795,925,1055].map(x=>'<path class="fd cv-dash" style="--t:.5s" d="M'+x+' 0Q'+(x+26)+' 142 '+x+' 285"/>').join('')+
  DEPTHS.map(([x,t])=>'<text class="fd cv-dim" style="--t:.7s" x="'+x+'" y="22" text-anchor="middle">'+t+' m</text>').join('')+
  /* stockpile and crusher */
  shape('ellipse','cx="52" cy="120" rx="36" ry="24"','cv-line',.2)+
  shape('ellipse','cx="52" cy="120" rx="24" ry="15"','cv-thin',.3)+
  shape('ellipse','cx="52" cy="120" rx="11" ry="6"','cv-thin',.4)+
  shape('rect','x="92" y="104" width="24" height="32"','cv-line',.4)+d(cross(92,104,24,32),'cv-thin',.5)+
  /* existing jetty and land conveyor */
  shape('rect','x="205" y="98" width="50" height="44"','cv-line',.5)+d(cross(205,98,50,44),'cv-thin',.6)+
  d('M116 115H432M116 125H432','cv-line',.6)+d(ticks(120,430,115,125,14),'cv-thin',.8)+
  /* new conveyor bridge */
  d('M432 113H776M432 127H776','cv-gold',.9)+d(zig(432,776,113,127,16),'cv-goldthin',1.1)+
  /* platform and rail */
  shape('rect','x="776" y="104" width="52" height="32"','cv-gold',1.1)+d(cross(776,104,52,32),'cv-goldthin',1.2)+
  d('M797 136V152M807 136V152','cv-gold',1.2)+
  d('M646 152H930M646 160H930','cv-line',1.2)+d(ticks(650,926,152,160,12),'cv-thin',1.3)+
  /* vessel */
  d('M622 178H900Q972 178 1004 205Q972 232 900 232H622Q606 205 622 178Z','cv-line',1)+
  shape('rect','x="628" y="186" width="18" height="38"','cv-thin',1.2)+
  HOLDS.map(x=>shape('rect','x="'+(x-20)+'" y="188" width="40" height="34"','cv-thin',1.3)+'<rect class="cv-fill" data-x="'+x+'" data-y="222" x="'+(x-20)+'" y="188" width="40" height="34"/>').join('')+
  '<path class="fd cv-center" style="--t:1.4s" d="M600 205H1020"/>'+
  /* dolphins */
  '<path class="fd cv-dash" style="--t:1.5s" d="M572 172L630 184M586 238L630 226M1060 172L986 190M1072 238L986 220"/>'+
  [[572,172],[586,238],[1060,172],[1072,238]].map(([x,y])=>shape('rect','x="'+(x-9)+'" y="'+(y-9)+'" width="18" height="18"','cv-line',1.4)+d(cross(x-9,y-9,18,18),'cv-thin',1.5)).join('')+
  [[684,156],[906,156]].map(([x,y])=>shape('circle','cx="'+x+'" cy="'+y+'" r="8"','cv-gold',1.4)).join('')+
  /* section marks */
  '<g class="fd" style="--t:1.6s"><path class="cv-dim-line" d="M170 120H186M1110 120H1126"/><text class="cv-dim" x="164" y="124" text-anchor="end">A</text><text class="cv-dim" x="1132" y="124">A</text></g>'+
  /* new-bridge dimension */
  '<g class="fd" style="--t:1.6s"><path class="cv-dim-line" d="M432 92V106M776 92V106M432 98H776"/><path class="cv-arrow" d="M432 98l9-3v6ZM776 98l-9-3v6Z"/></g>'+
  /* animated coal and loader */
  '<path class="fd cv-coal" style="--t:2s" d="M116 120H802V156"/>'+
  '<g class="cv-loader fd" style="--t:2s"><rect class="cv-carriage" x="-15" y="146" width="30" height="20"/><path class="cv-boom" d="M0 166V205"/></g>'+
  balloon(1,52,62,52,96)+balloon(2,230,62,230,98)+balloon(3,330,70,330,113)+balloon(4,604,66,604,98)+balloon(5,802,62,802,104)+balloon(6,684,118,684,148)+balloon(7,540,206,566,180)+balloon(8,812,262,812,232);

const section=
  '<path class="fd cv-water" style="--t:.5s" d="M150 380H1200"/>'+
  range(0,5,1).map(i=>'<path class="cv-wave" style="animation-delay:'+(-i*.9)+'s" d="M'+(300+i*170)+' 388q10-5 20 0t20 0"/>').join('')+
  /* seabed and piles */
  d(seabedPath,'cv-line',.3)+
  '<path class="fd cv-soil" style="--t:.8s" d="'+seabedPath+'V600H0Z"/>'+
  d('M0 330H112L150 380','cv-line',.2)+
  range(205,776,44).map((x,i)=>d('M'+x+' 330V'+seabed(x).toFixed(1),x>432?'cv-goldthin':'cv-thin',.7+i*.03)).join('')+
  /* stockpile and crusher */
  d('M14 330L52 278L90 330','cv-line',.3)+shape('rect','x="92" y="302" width="24" height="28"','cv-line',.4)+
  /* deck, truss and rail */
  d('M116 330H432','cv-line',.6)+d('M432 330H830','cv-gold',.9)+
  d('M432 314H830','cv-gold',1)+d(zig(432,830,314,330,16),'cv-goldthin',1.1)+
  d('M830 330H940','cv-line',1.2)+
  /* vessel profile, sinks as it loads */
  '<g class="cv-hullset">'+
  d('M616 346H1000L1016 338L996 408H636Q618 404 616 346Z','cv-line cv-solid',1)+
  shape('rect','x="626" y="306" width="24" height="40"','cv-thin',1.2)+d('M632 306V292H644V306','cv-thin',1.3)+
  HOLDS.map(x=>shape('rect','x="'+(x-20)+'" y="352" width="40" height="50"','cv-thin',1.3)+'<rect class="cv-fill" data-x="'+x+'" data-y="402" x="'+(x-20)+'" y="352" width="40" height="50"/>').join('')+
  '</g>'+
  DEPTHS.slice(0,6).map(([x,t])=>'<text class="fd cv-dim" style="--t:1.5s" x="'+x+'" y="'+(seabed(x)+18).toFixed(1)+'" text-anchor="middle">'+t+'</text>').join('')+
  /* animated coal and loader */
  '<path class="fd cv-coal" style="--t:2s" d="M116 322H802"/>'+
  '<g class="cv-loader fd" style="--t:2s"><rect class="cv-carriage" x="-15" y="316" width="30" height="14"/><path class="cv-boom" d="M0 330V352"/><path class="cv-pour" d="M0 352V396"/></g>';

host.innerHTML='<svg viewBox="0 0 1200 600" role="img" aria-labelledby="conveyor-note">'+
  '<defs><pattern id="cv-g1" width="20" height="20" patternUnits="userSpaceOnUse"><path class="cv-grid1" d="M20 0H0V20"/></pattern>'+
  '<pattern id="cv-g2" width="100" height="100" patternUnits="userSpaceOnUse"><path class="cv-grid2" d="M100 0H0V100"/></pattern>'+
  '<pattern id="cv-h" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path class="cv-hatch" d="M0 0V9"/></pattern>'+
  '<pattern id="cv-c" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="6" height="6" fill="#e9c87a" fill-opacity=".22"/><path class="cv-chatch" d="M0 0V6"/></pattern></defs>'+
  '<rect class="cv-paper" width="1200" height="600"/><rect width="1200" height="600" fill="url(#cv-g1)"/><rect width="1200" height="600" fill="url(#cv-g2)"/>'+
  plan+'<path class="fd cv-rule" style="--t:.1s" d="M0 288H1200"/>'+section+
  '<text class="cv-view fd" style="--t:.3s" x="16" y="24">'+i18n('x102')+'</text>'+
  '<text class="cv-view fd" style="--t:.3s" x="170" y="310">'+i18n('x103')+'</text>'+
  '<g class="fd" style="--t:1.8s"><rect class="cv-block" x="860" y="524" width="328" height="64"/><path class="cv-rulebox" d="M860 546H1188M1080 546V588"/>'+
  '<text class="cv-tb" x="870" y="540">PT JAYAKHISMA GLOBE INDONESIA</text>'+
  '<text class="cv-tb2" x="870" y="564">'+i18n('x90')+'</text><text class="cv-tb2" x="870" y="580">'+i18n('x104')+'</text>'+
  '<text class="cv-tb2" x="1090" y="572">NTS</text></g></svg>';

const svg=host.querySelector('svg');
svg.querySelectorAll('.dl').forEach(el=>el.setAttribute('pathLength','1'));
const loaders=[...host.querySelectorAll('.cv-loader')],pour=host.querySelector('.cv-pour'),fills=[...host.querySelectorAll('.cv-fill')],hull=host.querySelector('.cv-hullset');
const SLOT=4,N=HOLDS.length,T=N*SLOT+2;
const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
const fill=(el,s,o)=>{const x=+el.dataset.x,y=+el.dataset.y;el.setAttribute('transform','translate('+x+' '+y+') scale(1 '+s+') translate('+(-x)+' '+(-y)+')');el.style.opacity=o};
function render(t){
  const i=Math.min(N-1,Math.floor(t/SLOT)),f=(t-i*SLOT)/SLOT,end=t>=N*SLOT,back=end?(t-N*SLOT)/2:0;
  const prev=HOLDS[Math.max(0,i-1)],x=end?HOLDS[N-1]+(HOLDS[0]-HOLDS[N-1])*ease(back):prev+(HOLDS[i]-prev)*ease(Math.min(1,f/.2));
  loaders.forEach(l=>l.setAttribute('transform','translate('+x.toFixed(1)+' 0)'));
  pour.style.visibility=!end&&f>.2?'visible':'hidden';
  let load=0;
  fills.forEach((el,n)=>{
    const k=n%N,s=end?1:k<i?1:k===i?Math.max(0,(f-.2)/.8):0;
    fill(el,Math.max(.001,s),end?Math.max(0,1-back):s>0?1:0);
    if(n<N)load+=s;
  });
  hull.setAttribute('transform','translate(0 '+((end?1-ease(back):load/N)*9).toFixed(2)+')');
}
if(reduce){svg.classList.add('drawn');render(SLOT*3.6);return}
render(0);
let raf=0,t0=0,on=false;
function tick(now){if(!on)return;if(!t0)t0=now;render(((now-t0)/1000)%T);raf=requestAnimationFrame(tick)}
new IntersectionObserver(es=>{
  const v=es.some(e=>e.isIntersecting);
  if(v)svg.classList.add('drawn');
  if(v&&!on){on=true;t0=0;raf=requestAnimationFrame(tick)}else if(!v){on=false;cancelAnimationFrame(raf)}
},{threshold:.2}).observe(host);
})();
