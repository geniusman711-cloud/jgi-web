/* Online version of Form Pemesanan Batubara (documents/JGI-Form-PO-Batubara.pdf). */
(()=>{
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const EMAIL='pt.jayakhisma@gmail.com',cfg=window.JGI_CONFIG||{};
const saved=k=>{try{return localStorage.getItem(k)}catch{return null}};
const store=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
let lang=saved('jgi-language')==='en'?'en':'id';

const T={
 id:{eyebrow:'PESAN BATUBARA',title:'Form Pemesanan Batubara',sub:'Di tambang PT. JGI, site Tanjung Mangkalihat. Kolom bertanda * wajib diisi, kolom lain boleh dilengkapi bersama tim JGI.',pdf:'Unduh versi PDF untuk tanda tangan dan stempel',
  s5:'V. Pernyataan Pemohon',declare:'Dengan ini buyer mengajukan pemesanan batubara di tambang PT. JGI, site Tanjung Mangkalihat, sesuai isian formulir ini. Data dan dokumen buyer harus benar dan dapat diverifikasi. Ketersediaan, spesifikasi, harga, pembayaran, dan jadwal tunduk pada konfirmasi tertulis PT. JGI serta perjanjian yang disepakati para pihak. Formulir ini bukan bukti pembayaran atau akta notaris.',
  agree:'Saya menyetujui pernyataan di atas. *',fallback:'Tidak ada aplikasi email? Salin isi form dan kirim ke '+EMAIL+'.',copy:'Salin isi form',back:'Kembali ke website',
  send:'Kirim Form',mail:'Lanjutkan ke Email',invalid:'Lengkapi kolom yang ditandai.',ready:'Draft email sudah disiapkan. Selesaikan pengiriman di aplikasi email Anda.',sending:'Mengirim form…',ok:'Terima kasih. Form Anda sudah terkirim ke tim JGI.',fail:'Form gagal terkirim. Salin isi form dan kirim ke '+EMAIL+'.',copied:'Isi form disalin.',subject:'Form Pemesanan Batubara',light:'Aktifkan light mode',dark:'Aktifkan dark mode'},
 en:{eyebrow:'ORDER COAL',title:'Coal Order Form',sub:'At PT. JGI mine, Tanjung Mangkalihat site. Fields marked * are required. Other fields can be completed with the JGI team.',pdf:'Download the PDF version for signature and stamp',
  s5:'V. Buyer Declaration',declare:'The buyer hereby submits a coal order request at PT. JGI mine, Tanjung Mangkalihat site, as stated in this form. Buyer information and documents must be accurate and verifiable. Availability, specifications, pricing, payment, and schedule are subject to written confirmation by PT. JGI and an agreement between the parties. This form is neither proof of payment nor a notarial deed.',
  agree:'I agree to the declaration above. *',fallback:'No email application? Copy the form and send it to '+EMAIL+'.',copy:'Copy form',back:'Back to website',
  send:'Send Form',mail:'Continue to Email',invalid:'Please complete the marked fields.',ready:'Email draft prepared. Complete sending in your email application.',sending:'Sending form…',ok:'Thank you. Your form has reached the JGI team.',fail:'The form could not be sent. Copy it and send it to '+EMAIL+'.',copied:'Form copied.',subject:'Coal Order Form',light:'Switch to light mode',dark:'Switch to dark mode'}
};

/* [name, Indonesian label, English label, options] */
const SECTIONS=[
 {id:'I. Identitas Pemohon',en:'I. Buyer Information',f:[
  ['date','Tanggal','Date',{type:'date',today:true}],
  ['buyer','Nama buyer / pemohon','Buyer / applicant name',{req:true,auto:'organization'}],
  ['npwp','NPWP / Nomor Pokok Wajib Pajak','Taxpayer identification number'],
  ['nib','NIB / Nomor Induk Berusaha','Business identification number'],
  ['ipp','No. IPP / Izin Trader Batubara','IPP No. / Coal trading permit'],
  ['address','Alamat buyer','Buyer address',{area:true,auto:'street-address'}],
  ['pic','Nama PIC / jabatan','Contact person / position',{req:true,auto:'name'}],
  ['phone','Telepon buyer','Buyer phone',{req:true,type:'tel',auto:'tel'}],
  ['email','Email buyer','Buyer email',{req:true,type:'email',auto:'email'}]]},
 {id:'II. Rincian Pemesanan',en:'II. Order Details',f:[
  ['site','Tambang / site','Mine / site',{value:'PT. JGI / Tanjung Mangkalihat',readonly:true}],
  ['quantity','Jumlah (MT) / toleransi (%)','Quantity (MT) / tolerance (%)',{req:true}],
  ['schedule','Jadwal pengambilan / pengiriman','Pickup / delivery schedule']]},
 {id:'III. Detail Spesifikasi',en:'III. Specification Details',f:[
  ['gar','GAR (kcal/kg)','Calorific value (GAR)'],
  ['spec','Spesifikasi','Specification',{value:'Typical non-spec / Asalan (Raw Coal)'}],
  ['specnotes','Keterangan tambahan','Additional notes',{area:true}]]},
 {id:'IV. Harga, Penyerahan dan Cara Bayar',en:'IV. Price, Delivery and Payment',f:[
  ['price','Harga per MT / mata uang','Price per MT / currency'],
  ['value','Estimasi nilai pemesanan','Estimated order value'],
  ['taxes','Pajak / biaya yang termasuk','Included taxes / charges'],
  ['terms','Basis penyerahan / titik serah','Delivery terms / delivery point'],
  ['destination','Tujuan / lokasi bongkar','Destination / discharge location'],
  ['transport','Moda / penanggung angkutan','Transport mode / responsible party'],
  ['payment','Cara bayar (TT / LC / lainnya)','Payment method (TT / LC / other)'],
  ['advance','Uang muka (%) / syarat bayar','Advance payment (%) / terms'],
  ['balance','Pelunasan (%) / jatuh tempo','Balance payment (%) / due date'],
  ['surveyor','Surveyor / dasar mutu dan jumlah','Surveyor / quality and quantity basis'],
  ['documents','Dokumen pendukung buyer','Buyer supporting documents'],
  ['conditions','Catatan / syarat khusus','Notes / special conditions',{area:true}]]}
];

function build(){
  q('#order-fields').innerHTML=SECTIONS.map((s,si)=>'<section class="order-card"><h2 data-sec="'+si+'"></h2><div class="order-grid">'+s.f.map(([n,,,o={}])=>{
    const a='name="'+n+'" id="f-'+n+'" maxlength="600"'+(o.req?' required':'')+(o.readonly?' readonly':'')+(o.auto?' autocomplete="'+o.auto+'"':'');
    return '<label class="'+(o.area?'order-wide':'')+'"><span data-field="'+n+'"></span>'+(o.area?'<textarea rows="2" '+a+'></textarea>':'<input type="'+(o.type||'text')+'" '+a+'>')+'</label>';
  }).join('')+'</div></section>').join('');
  SECTIONS.forEach(s=>s.f.forEach(([n,,,o={}])=>{
    const el=q('#f-'+n);
    if(o.value)el.value=o.value;
    if(o.today){const d=new Date();el.value=new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)}
  }));
}
function label(n){for(const s of SECTIONS)for(const f of s.f)if(f[0]===n)return f[lang==='en'?2:1]}
function apply(next,persist){
  lang=next;document.documentElement.lang=lang;
  qa('[data-t]').forEach(e=>e.textContent=T[lang][e.dataset.t]);
  qa('[data-sec]').forEach(e=>{const s=SECTIONS[e.dataset.sec];e.textContent=s[lang]});
  qa('[data-field]').forEach(e=>{const n=e.dataset.field;e.textContent=label(n)+(q('#f-'+n).required?' *':'')});
  qa('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===lang)));
  q('#submit-label').textContent=T[lang][cfg.formEndpoint?'send':'mail'];
  document.title=T[lang].title+' — JGI';
  themeLabel();
  if(persist)store('jgi-language',lang);
}
function themeLabel(){const d=document.documentElement.dataset.theme==='dark';q('.theme-toggle').setAttribute('aria-label',T[lang][d?'light':'dark'])}
function summary(form){
  const data=new FormData(form),lines=[];
  SECTIONS.forEach(s=>{lines.push('','== '+s[lang]+' ==');s.f.forEach(([n])=>{const v=(data.get(n)||'').trim();lines.push(label(n)+': '+(v||'-'))})});
  return lines.join('\n').trim();
}
const form=q('#order-form'),status=q('#order-status');
form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(form._gotcha.value)return;
  if(!form.checkValidity()){
    form.classList.add('tried');status.textContent=T[lang].invalid;
    form.querySelector(':invalid').focus();return;
  }
  const text=summary(form),subject=T[lang].subject+' - '+form.buyer.value.trim();
  q('#order-copy').value=subject+'\n\n'+text;
  if(cfg.formEndpoint){
    const btn=form.querySelector('[type=submit]'),data=new FormData(form);
    data.set('subject',subject);data.delete('agree');data.set('declaration','agreed');
    btn.disabled=true;status.textContent=T[lang].sending;
    try{
      const r=await fetch(cfg.formEndpoint,{method:'POST',headers:{Accept:'application/json'},body:data});
      if(!r.ok)throw new Error(r.status);
      status.textContent=T[lang].ok;form.reset();build();apply(lang);
    }catch{status.textContent=T[lang].fail;q('.order-fallback').hidden=false}
    btn.disabled=false;return;
  }
  q('.order-fallback').hidden=false;status.textContent=T[lang].ready;
  location.href='mailto:'+EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(text);
});
q('#copy-order').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(q('#order-copy').value);status.textContent=T[lang].copied}
  catch{q('#order-copy').select()}
});
qa('[data-language]').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.language,true)));
q('.theme-toggle').addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;store('jgi-theme',t);themeLabel()});
build();apply(lang);
})();
