/* Draws the QR code in the order section. It points at pesan.html on the live site. */
(()=>{
const canvas=document.querySelector('#order-qr');
if(!canvas||!window.JGIQR)return;
const base=(window.JGI_CONFIG&&window.JGI_CONFIG.siteUrl||'').replace(/\/+$/,'');
const url=base?base+'/pesan.html':new URL('pesan.html',location.href.split('#')[0].split('?')[0]).href;
window.JGIQR.draw(canvas,url,1024);
canvas.dataset.url=url;
const local=!base&&(location.protocol==='file:'||['localhost','127.0.0.1','[::1]'].includes(location.hostname));
document.querySelector('.order-qr-note').hidden=!local;
document.querySelector('#order-qr-save').addEventListener('click',()=>{
  const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='QR-Form-Pemesanan-JGI.png';a.click();
});
document.querySelectorAll('.order-sheet').forEach((b,i)=>b.addEventListener('click',()=>{
  const en=document.documentElement.lang==='en';
  openImage(b.dataset.full,(en?'Coal order form · page ':'Form pemesanan batubara · halaman ')+(i+1),b);
}));
})();
