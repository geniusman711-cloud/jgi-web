/* Concession map: Tanjung Mangkalihat with the IUP boundary from the official boundary map (wilayah-data.js). */
(()=>{
const D=window.JGI_IUP,dlg=document.getElementById('wilayah');
if(!D||!dlg)return;
const host=dlg.querySelector('.iup-canvas'),btn=dlg.querySelector('.iup-toggle');
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const small=matchMedia('(max-width:700px)');
const copy=k=>window.JGI_COPY[k][language]||window.JGI_COPY[k].en;
const i18n=k=>'<tspan data-i18n="'+k+'">'+copy(k)+'</tspan>';
const NS='http://www.w3.org/2000/svg';

/* equirectangular projection around 1°N, 1 unit = 1 px at the wide layout */
const K=Math.cos(Math.PI/180),PPD=4170,LON0=118.70,LAT0=1.13;
const P=([lon,lat])=>[(lon-LON0)*PPD*K,(LAT0-lat)*PPD];
const path=(c,close)=>c.map((q,i)=>{const [x,y]=P(q);return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)}).join('')+(close?'Z':'');
const box=(lon0,lon1,lat0,lat1)=>{const [x0,y0]=P([lon0,lat1]),[x1,y1]=P([lon1,lat0]);return [x0,y0,x1-x0,y1-y0]};
const VIEW={wide:box(118.80,119.03,0.912,1.066),tall:box(118.806,119.03,0.902,1.072)};

/* area-weighted centroid of the boundary */
const centroid=(()=>{let a=0,x=0,y=0;const c=D.iup;
  for(let i=0;i<c.length;i++){const p=c[i],q=c[(i+1)%c.length],f=p[0]*q[1]-q[0]*p[1];a+=f;x+=(p[0]+q[0])*f;y+=(p[1]+q[1])*f}
  return [x/(3*a),y/(3*a)]})();
const land=[...D.coast,[118.62,1.2],[118.62,0.8]];

let svg,view,shown=false,played=false,timer=0,raf=0;

function labels(){
  const t=(k,c,cls,anchor)=>{const [x,y]=P(c);return '<text class="iup-label '+cls+'" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="'+(anchor||'middle')+'">'+i18n(k)+'</text>'};
  if(small.matches){
    /* phone: cape name sits in open sea to the north-east with a leader line */
    const [kx,ky]=P(D.cape),[lx,ly]=P([119.026,1.058]);
    return t('x116',[118.968,0.913],'sea')+t('x118',[118.865,1.072],'sea')+
      '<path class="iup-leader" d="M'+kx.toFixed(1)+' '+ky.toFixed(1)+'L'+(lx-30).toFixed(1)+' '+(ly+12).toFixed(1)+'"/>'+
      '<text class="iup-label place" x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="end">'+i18n('x119')+'</text>';
  }
  return t('x117',[119.008,1.059],'sea')+t('x116',[118.995,0.925],'sea')+t('x118',[118.853,1.0605],'sea')+
    t('x119',[D.cape[0]+.0035,D.cape[1]-.0008],'place','start');
}
function draw(){
  const v=small.matches?VIEW.tall:VIEW.wide;view=v;
  const [cx,cy]=P(centroid),[jx,jy]=P(D.jetty),[kx,ky]=P(D.cape);
  const verts=D.iup.map((c,i)=>{const [x,y]=P(c);return '<circle class="iup-vertex" style="--d:'+(i/D.iup.length*2.2).toFixed(2)+'s" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.2"/>'}).join('');
  const km5=5/111.32*PPD*K;
  host.innerHTML='<svg viewBox="'+v.join(' ')+'" role="img" aria-labelledby="iup-title iup-note">'+
    '<defs><pattern id="iup-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><path d="M0 0V9"/></pattern>'+
    '<clipPath id="iup-clip"><path d="'+path(D.iup,true)+'"/></clipPath></defs>'+
    '<rect class="iup-sea" x="'+(v[0]-400)+'" y="'+(v[1]-400)+'" width="'+(v[2]+800)+'" height="'+(v[3]+800)+'"/>'+
    '<g class="iup-grid">'+grid(v)+'</g>'+
    '<path class="iup-land" d="'+path(land,true)+'"/>'+
    '<g class="iup-area"><path class="iup-fill" d="'+path(D.iup,true)+'"/>'+
      '<rect class="iup-hatch" clip-path="url(#iup-clip)" x="'+(v[0]-50)+'" y="'+(v[1]-50)+'" width="'+(v[2]+100)+'" height="'+(v[3]+100)+'"/>'+
      '<path class="iup-edge" pathLength="1" d="'+path(D.iup,true)+'"/>'+
      '<path class="iup-ants" d="'+path(D.iup,true)+'"/>'+verts+
      '<g class="iup-jetty" transform="translate('+jx.toFixed(1)+' '+jy.toFixed(1)+')"><rect x="-4" y="-4" width="8" height="8" transform="rotate(45)"/><text class="iup-label place" '+(small.matches?'x="-10" y="-6" text-anchor="end"':'x="10" y="-8"')+'>'+i18n('t31')+'</text></g>'+
      '<g class="iup-area-label" transform="translate('+cx.toFixed(1)+' '+(cy+44).toFixed(1)+')"><text class="iup-big" text-anchor="middle">'+i18n('x112')+'</text><text class="iup-small" y="22" text-anchor="middle">'+i18n('x113')+'</text></g></g>'+
    labels()+
    '<g class="iup-cape" transform="translate('+kx.toFixed(1)+' '+ky.toFixed(1)+')"><circle r="3"/></g>'+
    '<g class="iup-pin" tabindex="0" role="button" aria-controls="iup-note" transform="translate('+cx.toFixed(1)+' '+cy.toFixed(1)+')">'+
      '<circle class="iup-pulse" r="14"/><circle class="iup-pulse two" r="14"/>'+
      '<g class="iup-drop"><path class="iup-pin-body" d="M0 0C-4-9-13-14-13-24A13 13 0 1 1 13-24C13-14 4-9 0 0Z"/><circle class="iup-pin-eye" cy="-24" r="5"/></g>'+
      '<g class="iup-tag"><rect class="iup-tag-bg" rx="15" height="30"/><text class="iup-tag-text" y="5">PT JGI Coal Mining</text></g></g>'+
    '<g class="iup-scale"><path/><text/></g>'+
    '<g class="iup-north"><path d="M0-15L6 7L0 3L-6 7Z"/><text y="-20" text-anchor="middle">N</text></g></svg>';
  svg=host.querySelector('svg');
  svg.dataset.km5=km5;
  const pin=svg.querySelector('.iup-pin');
  pin.addEventListener('click',toggle);
  pin.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
  fit();
  if(shown)svg.classList.add('show','done');
  if(!played&&!reduce){svg.classList.add('intro','wait');svg.setAttribute('viewBox',startBox().map(n=>n.toFixed(1)).join(' '))}
}
function grid(v){
  /* one-minute graticule, as on the official sheet */
  let s='';
  for(let m=0;m<=20;m++){const lon=118+47/60+m/60,[x]=P([lon,1]);s+='<path d="M'+x.toFixed(1)+' '+(v[1]-400)+'V'+(v[1]+v[3]+400)+'"/>'}
  for(let m=0;m<=14;m++){const lat=0+53/60+m/60,[,y]=P([119,lat]);s+='<path d="M'+(v[0]-400)+' '+y.toFixed(1)+'H'+(v[0]+v[2]+400)+'"/>'}
  return s;
}
/* keep text and markers the same on-screen size at any width */
function fit(){
  if(!svg)return;
  const w=svg.getBoundingClientRect().width||host.clientWidth||1000;
  const k=Math.max(.6,view[2]/w);
  svg.style.setProperty('--k',k);
  const tag=svg.querySelector('.iup-tag'),bg=tag.querySelector('rect'),tx=tag.querySelector('text');
  const tk=small.matches?k*.85:k;tag.setAttribute('transform','translate(0 '+(-54*tk)+') scale('+tk+')');
  svg.querySelector('.iup-drop').setAttribute('transform','scale('+k+')');
  svg.querySelectorAll('.iup-pulse').forEach(c=>c.setAttribute('r',14*k));
  const tw=tx.getComputedTextLength?tx.getComputedTextLength():150;
  bg.setAttribute('x',-(tw/2+16));bg.setAttribute('width',tw+32);bg.setAttribute('y',-15);
  tx.setAttribute('text-anchor','middle');
  svg.querySelectorAll('.iup-jetty,.iup-cape').forEach(g=>{const t=g.getAttribute('transform').replace(/ scale\([^)]*\)/,'');g.setAttribute('transform',t+' scale('+k+')')});
  svg.querySelector('.iup-area-label').setAttribute('transform',svg.querySelector('.iup-area-label').getAttribute('transform').replace(/ scale\([^)]*\)/,'')+' scale('+k+')');
  const km5=+svg.dataset.km5,sx=view[0]+18*k,sy=view[1]+view[3]-20*k;
  svg.querySelector('.iup-scale path').setAttribute('d','M'+sx+' '+(sy-5*k)+'V'+sy+'H'+(sx+km5)+'V'+(sy-5*k));
  const st=svg.querySelector('.iup-scale text');st.setAttribute('x',sx+km5+8*k);st.setAttribute('y',sy+1*k);st.textContent='5 km';
  svg.querySelector('.iup-north').setAttribute('transform','translate('+(view[0]+view[2]-26*k)+' '+(view[1]+view[3]-22*k)+') scale('+k+')');
}
const startBox=()=>{const [cx,cy]=P(centroid),s=.62;return [cx-view[2]*s/2,cy-view[3]*s/2,view[2]*s,view[3]*s]};
/* gentle camera move from close-up to the full view */
function zoomIn(){
  cancelAnimationFrame(raf);
  if(reduce){svg.setAttribute('viewBox',view.join(' '));return}
  const from=startBox(),t0=performance.now(),dur=1500;
  (function tick(now){
    const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);
    svg.setAttribute('viewBox',from.map((a,i)=>(a+(view[i]-a)*e).toFixed(1)).join(' '));
    if(p<1)raf=requestAnimationFrame(tick);
  })(t0);
}
function toggle(){
  clearTimeout(timer);
  if(shown){
    svg.classList.remove('show','done');void svg.getBoundingClientRect();
  }
  shown=true;
  svg.classList.add('show');
  btn.querySelector('span').dataset.i18n='x121';btn.querySelector('span').innerHTML=copy('x121');
  timer=setTimeout(()=>svg.classList.add('done'),reduce?0:3400);
}
/* plays the intro the first time the section scrolls into view */
function intro(){
  if(played)return;played=true;
  fit();svg.classList.add('intro');svg.classList.remove('wait');zoomIn();
}
draw();
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();intro()}},{threshold:.35});
  io.observe(host);
}else intro();
if(location.hash==='#wilayah')setTimeout(()=>{intro();if(!shown)setTimeout(toggle,reduce?0:1700)},reduce?0:600);
/* links elsewhere on the page scroll here, then reveal the boundary */
document.querySelectorAll('.iup-open').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();
  dlg.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  setTimeout(()=>{intro();if(!shown)setTimeout(toggle,reduce?0:1700)},reduce?0:700);
}));
btn.addEventListener('click',toggle);
small.addEventListener('change',()=>{draw();if(played)svg.classList.add('intro')});
addEventListener('resize',fit);
document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>setTimeout(fit)));
})();
