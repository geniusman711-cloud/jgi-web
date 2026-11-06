(()=>{
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- scroll reveal ---------- */
const revealSel=['.about-heading','.about-copy','.section-head','.route-tabs','.route-panels','.terminal','.product-layout>*','.commitment-layout>*','.story','.credentials>*','.contact-layout>*','.order-head>*','.order-row>*','.gallery-item','.band-inner','.metrics>div','.footer-top>*'];
const targets=[...new Set(qa(revealSel.join(',')))];
targets.forEach(el=>{
  el.classList.add('reveal');
  const sibs=[...el.parentElement.children].filter(c=>c.classList.contains('reveal')||targets.includes(c));
  el.style.setProperty('--d',(Math.min(sibs.indexOf(el),5)*0.09)+'s');
});
if('IntersectionObserver' in window){
  const io=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  targets.forEach(el=>io.observe(el));
}else targets.forEach(el=>el.classList.add('in'));

/* ---------- animated counters ---------- */
function fmt(n,sep){const s=String(Math.round(n));return sep?s.replace(/\B(?=(\d{3})+(?!\d))/g,sep):s}
function animateCounter(strong){
  if(reduce)return;
  const w=document.createTreeWalker(strong,NodeFilter.SHOW_TEXT);const nodes=[];
  while(w.nextNode()){const n=w.currentNode;if(n.parentElement.closest('small'))continue;if(/\d/.test(n.data))nodes.push([n,n.data])}
  const t0=performance.now(),dur=1500;
  (function tick(now){
    const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);
    nodes.forEach(([n,orig])=>{
      if(!n.isConnected)return;
      n.data=p>=1?orig:orig.replace(/\d[\d.,]*/g,tok=>{
        const sep=/^\d{1,3}([.,]\d{3})+$/.test(tok)?tok.match(/[.,]/)[0]:'';
        const target=parseInt(tok.replace(/[^\d]/g,''),10);
        return fmt(target*e,sep)
      });
    });
    if(p<1)requestAnimationFrame(tick);
  })(t0);
}
const metrics=q('.metrics');
if(metrics&&'IntersectionObserver' in window){
  const mo=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){mo.disconnect();qa('.metrics strong').forEach(animateCounter)}},{threshold:.5});
  mo.observe(metrics);
}

const calorie=q('.calorie strong');
if(calorie&&'IntersectionObserver' in window){
  const co=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){co.disconnect();animateCounter(calorie)}},{threshold:.6});
  co.observe(calorie);
}

/* tab photos wipe in the direction of travel */
let lastRoute=0;
document.addEventListener('route:change',e=>{q('.route-panels').dataset.dir=e.detail<lastRoute?'back':'fwd';lastRoute=e.detail});

/* ---------- scroll effects: progress, parallax, active nav ---------- */
const bar=q('.scroll-progress'),heroMedia=q('.hero-media'),heroContent=q('.hero-content'),bandMedia=q('.band-media'),band=q('.photo-band');
const navMap={profil:'profil',operasional:'operasional',produk:'produk',komitmen:'komitmen',kegiatan:'komitmen',galeri:'galeri',legalitas:null,kontak:null,pesan:'pesan'};
const sections=Object.keys(navMap).map(id=>q('#'+id)).filter(Boolean);
const navLinks=qa('#main-nav a[href^="#"]');

/* floating contact: WhatsApp when configured, otherwise the contact section */
const cfg=window.JGI_CONFIG||{},fab=q('.contact-fab');
if(fab){
  const wa=(cfg.whatsapp||'').replace(/\D/g,'');
  if(wa){fab.href='https://wa.me/'+wa;fab.target='_blank';fab.rel='noopener';fab.hidden=false}
  else if(innerWidth<=1050)fab.hidden=false;
}

let ticking=false;
function frame(){
  ticking=false;
  const y=scrollY,vh=innerHeight,max=document.documentElement.scrollHeight-vh;
  if(bar)bar.style.transform='scaleX('+(max>0?Math.min(1,y/max):0)+')';
  if(!reduce){
    if(heroMedia&&y<vh*1.3){const s=1+y/vh*.35,H=heroMedia.offsetHeight;heroMedia.style.transform='translate3d(0,'+Math.min(y*.2,(s-1)*H)+'px,0) scale('+s+')'}
    if(heroContent&&y<vh){heroContent.style.transform='translate3d(0,'+(y*.1)+'px,0)';heroContent.style.opacity=Math.max(0,1-y/(vh*.8))}
    if(band&&bandMedia){const r=band.getBoundingClientRect();if(r.bottom>0&&r.top<vh){const off=(r.top+r.height/2-vh/2)*-.14;bandMedia.style.transform='translate3d(0,'+off+'px,0)'}}
  }
  if(fab){const c=q('#kontak').getBoundingClientRect().top;fab.classList.toggle('show',y>vh*.8&&c>vh*.7)}
  let cur=null;
  for(const s of sections){if(s.getBoundingClientRect().top<=vh*.32)cur=s.id}
  const key=cur?navMap[cur]:null;
  navLinks.forEach(a=>a.classList.toggle('active',!!key&&a.getAttribute('href')==='#'+key));
}
function req(){if(!ticking){ticking=true;requestAnimationFrame(frame)}}
addEventListener('scroll',req,{passive:true});
addEventListener('resize',req);
addEventListener('load',()=>{req();qa('.route-panel img').forEach(i=>{i.loading='eager'})});
frame();

/* blueprint image opens the lightbox */
const thumb=q('.terminal-thumb');
if(thumb)thumb.addEventListener('click',()=>q('.plan-open').click());

/* real form delivery when an endpoint is configured */
const form=q('#contact-form');
if(cfg.formEndpoint&&form){
  Object.assign(window.JGI_COPY,window.JGI_FORM_COPY);
  applyLanguage(language);
  form.addEventListener('submit',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    const status=q('#form-status'),btn=form.querySelector('button[type=submit]'),text=window.JGI_FORM_STATUS[language];
    const data=new FormData(form);
    if(data.get('_gotcha'))return;
    data.set('subject',form.querySelector('select').selectedOptions[0].textContent);
    btn.disabled=true;status.textContent=text.sending;
    try{
      const res=await fetch(cfg.formEndpoint,{method:'POST',headers:{Accept:'application/json'},body:data});
      if(!res.ok)throw new Error(res.status);
      status.textContent=text.ok;form.reset();
    }catch{status.textContent=text.fail}
    btn.disabled=false;
  },true);
}

/* ---------- gallery lightbox with prev/next ---------- */
const more=q('.gallery-more');
if(more)more.addEventListener('click',()=>{qa('.gallery-item[hidden]').forEach(i=>{i.hidden=false});more.remove()});
const dlg=q('#lightbox'),items=qa('.gallery-item'),prev=q('.lb-prev'),next=q('.lb-next');
let gi=-1;
function labels(){const l=document.documentElement.lang;prev.setAttribute('aria-label',{en:'Previous photo',zh:'上一张'}[l]||'Foto sebelumnya');next.setAttribute('aria-label',{en:'Next photo',zh:'下一张'}[l]||'Foto berikutnya')}
function showGallery(i){
  gi=(i+items.length)%items.length;const it=items[gi];
  const cap=it.querySelector('.gallery-cap').textContent;
  const img=dlg.querySelector('img');img.src=it.dataset.full;img.alt=cap;q('#image-caption').textContent=cap+' · '+({en:'JGI photograph',zh:'JGI 实景照片'}[document.documentElement.lang]||'dokumentasi JGI');
}
items.forEach((it,i)=>it.addEventListener('click',()=>{
  openImage(it.dataset.full,it.querySelector('.gallery-cap').textContent,it);
  prev.hidden=next.hidden=false;labels();showGallery(i);
}));
prev.addEventListener('click',()=>showGallery(gi-1));next.addEventListener('click',()=>showGallery(gi+1));
dlg.addEventListener('close',()=>{prev.hidden=next.hidden=true;gi=-1});
document.addEventListener('keydown',e=>{if(!dlg.open||gi<0)return;if(e.key==='ArrowLeft')showGallery(gi-1);else if(e.key==='ArrowRight')showGallery(gi+1)});
})();
