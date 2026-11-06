/* Operating-area map for the Operations section, drawn from real geography (route-map-data.js). */
(()=>{
const host=document.querySelector('.route-map-canvas'),M=window.JGI_MAP;
if(!host||!M)return;
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const small=matchMedia('(max-width:700px)');
const copy=k=>window.JGI_COPY[k][language]||window.JGI_COPY[k].en;
const i18n=k=>'<tspan data-i18n="'+k+'">'+copy(k)+'</tspan>';

const STOPS=[
  {name:'t28',sub:i18n('t132')+' Ha'},
  {name:'t29',sub:'±5 km'},
  {name:'t30',sub:'10 Ha'},
  {name:'t31',sub:'300 ft'},
  {name:'x40',sub:i18n('x39')}
];

/* the panel maps a real lon/lat box to the SVG */
const LAYOUTS={
  wide:{w:1200,h:560,lon:118.9125,lat:1.058,ppd:19310,km:1,north:[1158,46],vessel:[70,3,1],callout:[70,18,'start',62,12],
    labels:[[0,30,'middle'],[-16,-2,'end'],[-10,-30,'end'],[2,30,'start'],[0,-34,'middle']]},
  tall:{w:360,h:400,lon:118.9368,lat:1.058,ppd:13793,km:1,north:[30,76],vessel:[36,-8,.72],callout:[87,28,'end',44,14],
    labels:[[15,-2,'start'],[14,22,'start'],[-20,-22,'end'],[-48,32,'start'],[-14,-26,'end']]}
};

const WAVES=[[118.9625,1.0565],[118.9545,1.0565],[118.9690,1.0478],[118.9610,1.0465],[118.9710,1.0545],[118.9720,1.0400],[118.9592,1.0540]];
const proj=(p,[lon,lat])=>[(lon-p.lon)*p.ppd,(p.lat-lat)*p.ppd];
const line=(p,c,close)=>c.map((q,i)=>{const [x,y]=proj(p,q);return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)}).join('')+(close?'Z':'');

let svg,route,marker,total=0,lens=[],pos=0,raf=0;

function selected(){
  const i=routeTabs.findIndex(t=>t.getAttribute('aria-selected')==='true');
  return i<0?0:i;
}
function mover(shape,d,dur,delay,turn){
  return '<g class="rm-barge" opacity="0">'+shape+
    '<animateMotion dur="'+dur+'s" begin="'+delay+'s" repeatCount="indefinite" path="'+d+'"'+(turn?' rotate="auto"':'')+'/>'+
    '<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.05;.95;1" dur="'+dur+'s" begin="'+delay+'s" repeatCount="indefinite"/></g>';
}
const TRUCK='<g class="rm-truck" transform="scale(1.05)"><path d="M-9-4H3V4H-9Z"/><path class="rm-load" d="M-8-3H2V3H-8Z"/><path d="M4-3.5H8Q9-3.5 9-2.5V2.5Q9 3.5 8 3.5H4Z"/></g>';
const VESSEL='<path d="M-40-5H34L44-7L36 9H-34Z"/><path d="M-36-16H-20V-5H-36Z"/><path d="M-32-22H-24V-16H-32Z"/><path class="rm-coal" d="M-14-9H30V-5H-14Z"/><path class="rm-crane" d="M-6-5V-20L12-11M18-5V-20L34-11"/>';
const BARGE='<path d="M-14-3H14L11 5H-11Z"/><path class="rm-coal" d="M-11-3L-5-9H5L11-3Z"/>';

/* the barge sails out, waits alongside the MV, then returns */
function shuttle(shape,d){
  return '<g class="rm-barge">'+shape+'<animateMotion dur="16s" repeatCount="indefinite" path="'+d+'" calcMode="spline" keyPoints="0;0;1;1;0" keyTimes="0;.08;.42;.58;1" keySplines="0 0 1 1;.45 0 .55 1;0 0 1 1;.45 0 .55 1"/></g>';
}
function callout(L,pts){
  const [jx,jy]=pts[3],[ax,ay]=pts[4],[cx,cy,an,ex,ey]=L.callout;
  return '<g class="rm-callout"><path d="M'+((jx+ax)/2).toFixed(1)+' '+((jy+ay)/2).toFixed(1)+'L'+(jx+ex).toFixed(1)+' '+(jy+ey).toFixed(1)+'"/>'+
    '<text class="rm-name" x="'+(jx+cx).toFixed(1)+'" y="'+(jy+cy).toFixed(1)+'" text-anchor="'+an+'">'+i18n('x42')+'</text>'+
    '<text class="rm-sub" x="'+(jx+cx).toFixed(1)+'" y="'+(jy+cy+18).toFixed(1)+'" text-anchor="'+an+'">'+i18n('x41')+'</text></g>';
}
function draw(){
  const L=small.matches?LAYOUTS.tall:LAYOUTS.wide;
  const nearest=(c,t)=>c.reduce((b,q,i)=>{const d=(q[0]-t[0])**2+(q[1]-t[1])**2;return d<b[0]?[d,i]:b},[Infinity,0])[1];
  const haul=M.road.slice(0,nearest(M.road,M.stops[2])+1);
  const seaStop=M.sea[M.seaStop],toAnchor=M.sea.slice(0,M.seaStop+1);
  const pts=[...M.stops.map(c=>proj(L,c)),proj(L,seaStop)];
  const stops=STOPS.map((s,i)=>{
    const [x,y]=pts[i],[lx,ly,an]=L.labels[i];
    return '<g class="rm-stop" data-i="'+i+'" transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+')">'+
      '<circle class="rm-hit" r="18"/><circle class="rm-pulse" r="8"/><circle class="rm-ring" r="8"/><circle class="rm-dot" r="3"/>'+
      '<text class="rm-name" x="'+lx+'" y="'+ly+'" text-anchor="'+an+'">'+i18n(s.name)+'</text>'+
      '<text class="rm-sub" x="'+lx+'" y="'+(ly+18)+'" text-anchor="'+an+'">'+s.sub+'</text></g>';
  }).join('');
  const kmW=L.km/111*L.ppd,sx=18,sy=L.h-22;
  host.innerHTML='<svg viewBox="0 0 '+L.w+' '+L.h+'" role="img" aria-labelledby="route-map-note">'+
    '<rect class="rm-sea" width="'+L.w+'" height="'+L.h+'"/>'+
    WAVES.map((c,i)=>{const [x,y]=proj(L,c);return '<path class="rm-wave" style="animation-delay:'+(-i*1.3)+'s" d="M'+x.toFixed(1)+' '+y.toFixed(1)+'q11-6 22 0t22 0"/>'}).join('')+
    [0,1].map(i=>'<ellipse class="rm-ripple" style="animation-delay:'+(i*2.6)+'s" cx="'+(pts[4][0]+L.vessel[0]).toFixed(1)+'" cy="'+(pts[4][1]+L.vessel[1]+6).toFixed(1)+'" rx="'+(44*L.vessel[2])+'" ry="'+(12*L.vessel[2])+'"/>').join('')+
    '<path class="rm-land" d="'+line(L,M.local,true)+'"/>'+
    '<path class="rm-road" d="'+line(L,M.road)+'"/>'+
    '<path class="rm-route" d="'+line(L,toAnchor)+'"/>'+
    '<path class="rm-progress" d="'+line(L,[...M.road,...toAnchor.slice(1)])+'"/>'+
    '<path class="rm-flow" d="'+line(L,M.road)+'"/>'+
    mover(TRUCK,line(L,haul),15,0,true)+mover(TRUCK,line(L,haul),15,-5,true)+mover(TRUCK,line(L,haul),15,-10,true)+
    shuttle('<g transform="scale(.5)">'+BARGE+'</g>',line(L,toAnchor))+
    '<g transform="translate('+(pts[4][0]+L.vessel[0]).toFixed(1)+' '+(pts[4][1]+L.vessel[1]).toFixed(1)+') scale('+L.vessel[2]+')"><g class="rm-vessel">'+VESSEL+'</g></g>'+
    '<text class="rm-title" x="18" y="30">'+i18n('x37')+'</text>'+
    '<g class="rm-scale"><path d="M'+sx+' '+(sy-5)+'V'+sy+'H'+(sx+kmW)+'V'+(sy-5)+'"/><text x="'+(sx+kmW+8)+'" y="'+(sy+1)+'">'+L.km+' km</text></g>'+
    '<g class="rm-north" transform="translate('+L.north[0]+' '+L.north[1]+')"><path d="M0-15L6 7L0 3L-6 7Z"/><text y="-20" text-anchor="middle">N</text></g>'+
    callout(L,pts)+stops+
    '<g class="rm-marker"><circle class="rm-marker-halo" r="8"/><circle class="rm-marker-dot" r="3.4"/></g></svg>';
  svg=host.querySelector('svg');route=svg.querySelector('.rm-progress');marker=svg.querySelector('.rm-marker');
  total=route.getTotalLength();
  lens=pts.map(([x,y])=>{
    let best=0,dist=Infinity;
    for(let l=0;l<=total;l+=1){const p=route.getPointAtLength(l),d=(p.x-x)**2+(p.y-y)**2;if(d<dist){dist=d;best=l}}
    return best;
  });
  route.style.strokeDasharray=total+' '+total;
  svg.querySelectorAll('.rm-stop').forEach(g=>g.addEventListener('click',()=>selectRoute(+g.dataset.i)));
  if(reduce)svg.pauseAnimations();
  setStep(selected(),false);
}
function place(l){
  pos=l;
  const p=route.getPointAtLength(l);
  marker.setAttribute('transform','translate('+p.x+' '+p.y+')');
  route.style.strokeDashoffset=total-l;
}
function setStep(i,animate){
  svg.querySelectorAll('.rm-stop').forEach((g,n)=>{g.classList.toggle('on',n===i);g.classList.toggle('done',n<i)});
  cancelAnimationFrame(raf);
  const from=pos,to=lens[i];
  if(!animate||reduce){place(to);return}
  const t0=performance.now(),dur=Math.min(1800,600+Math.abs(to-from)*1.2);
  (function tick(now){
    const p=Math.min(1,Math.max(0,(now-t0)/dur)),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
    place(from+(to-from)*e);
    if(p<1)raf=requestAnimationFrame(tick);
  })(t0);
}
document.addEventListener('route:change',e=>setStep(e.detail,true));
small.addEventListener('change',()=>{pos=0;draw()});
draw();
})();
