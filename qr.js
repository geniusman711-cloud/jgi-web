/* Small QR code encoder: byte mode, error correction level M, versions 1-10. No dependencies. */
(function(root){
const BLOCKS=[null,[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],[16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44]];
const ALIGN=[null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
const EXP=new Array(512),LOG=new Array(256);
for(let i=0,x=1;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11D}
for(let i=255;i<512;i++)EXP[i]=EXP[i-255];
const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
function generator(n){let g=[1];for(let i=0;i<n;i++){const r=new Array(g.length+1).fill(0);g.forEach((c,j)=>{r[j]^=c;r[j+1]^=mul(c,EXP[i])});g=r}return g}
function remainder(data,n){
  const g=generator(n),r=new Array(n).fill(0);
  for(const b of data){const f=b^r.shift();r.push(0);for(let i=0;i<n;i++)r[i]^=mul(g[i+1],f)}
  return r;
}
function codewords(bytes,v){
  const [ec,b1,d1,b2,d2]=BLOCKS[v],cap=b1*d1+b2*d2,bits=[];
  const put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push(val>>>i&1)};
  put(4,4);put(bytes.length,v<10?8:16);bytes.forEach(b=>put(b,8));
  put(0,Math.min(4,cap*8-bits.length));
  while(bits.length%8)bits.push(0);
  const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(''),2));
  for(let p=0xEC;data.length<cap;p^=0xFD)data.push(p);
  const blocks=[];let k=0;
  for(let i=0;i<b1+b2;i++){const n=i<b1?d1:d2,d=data.slice(k,k+n);k+=n;blocks.push({d,e:remainder(d,ec)})}
  const out=[],max=Math.max(d1,d2);
  for(let i=0;i<max;i++)blocks.forEach(b=>{if(i<b.d.length)out.push(b.d[i])});
  for(let i=0;i<ec;i++)blocks.forEach(b=>out.push(b.e[i]));
  return out;
}
const MASKS=[(x,y)=>(x+y)%2==0,(x,y)=>y%2==0,(x,y)=>x%3==0,(x,y)=>(x+y)%3==0,(x,y)=>((x/3|0)+(y/2|0))%2==0,(x,y)=>x*y%2+x*y%3==0,(x,y)=>(x*y%2+x*y%3)%2==0,(x,y)=>((x+y)%2+x*y%3)%2==0];
function penalty(m){
  const n=m.length;let p=0,dark=0;
  const run=line=>{let c=1;for(let i=1;i<=n;i++){if(i<n&&line[i]===line[i-1])c++;else{if(c>=5)p+=c-2;c=1}}
    const s=line.map(Number).join('');for(const t of ['10111010000','00001011101'])for(let i=s.indexOf(t);i>=0;i=s.indexOf(t,i+1))p+=40};
  for(let y=0;y<n;y++){run(m[y]);run(m.map(r=>r[y]))}
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(m[y][x])dark++;if(x<n-1&&y<n-1&&m[y][x]===m[y][x+1]&&m[y][x]===m[y+1][x]&&m[y][x]===m[y+1][x+1])p+=3}
  return p+Math.floor(Math.abs(dark*20/(n*n)-10))*10;
}
function encode(text){
  const bytes=[...new TextEncoder().encode(text)];
  let v=1;
  for(;v<=10;v++){const [,b1,d1,b2,d2]=BLOCKS[v];if(4+(v<10?8:16)+bytes.length*8<=(b1*d1+b2*d2)*8)break}
  if(v>10)throw new Error('Text too long for QR');
  const n=17+4*v,mod=[...Array(n)].map(()=>Array(n).fill(false)),fn=[...Array(n)].map(()=>Array(n).fill(false));
  const set=(x,y,d)=>{mod[y][x]=d;fn[y][x]=true};
  const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=n||y>=n)continue;const d=Math.max(Math.abs(dx),Math.abs(dy));set(x,y,d!==2&&d!==4)}};
  for(let i=0;i<n;i++){set(6,i,i%2==0);set(i,6,i%2==0)}
  finder(3,3);finder(n-4,3);finder(3,n-4);
  const A=ALIGN[v];
  A.forEach((ay,i)=>A.forEach((ax,j)=>{
    if((i==0&&j==0)||(i==0&&j==A.length-1)||(i==A.length-1&&j==0))return;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ax+dx,ay+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
  }));
  const format=mask=>{
    const d=mask;let r=d;for(let i=0;i<10;i++)r=r<<1^(r>>>9)*0x537;
    const b=(d<<10|r)^0x5412,bit=i=>(b>>>i&1)!==0;
    for(let i=0;i<6;i++)set(8,i,bit(i));
    set(8,7,bit(6));set(8,8,bit(7));set(7,8,bit(8));
    for(let i=9;i<15;i++)set(14-i,8,bit(i));
    for(let i=0;i<8;i++)set(n-1-i,8,bit(i));
    for(let i=8;i<15;i++)set(8,n-15+i,bit(i));
    set(8,n-8,true);
  };
  format(0);
  if(v>=7){
    let r=v;for(let i=0;i<12;i++)r=r<<1^(r>>>11)*0x1F25;
    const b=v<<12|r;
    for(let i=0;i<18;i++){const d=(b>>>i&1)!==0,a=n-11+i%3,c=i/3|0;set(a,c,d);set(c,a,d)}
  }
  const data=codewords(bytes,v);
  let i=0;
  for(let right=n-1;right>=1;right-=2){
    if(right==6)right=5;
    for(let vert=0;vert<n;vert++)for(let j=0;j<2;j++){
      const x=right-j,y=(right+1&2)==0?n-1-vert:vert;
      if(!fn[y][x]&&i<data.length*8){mod[y][x]=(data[i>>>3]>>>7-(i&7)&1)!==0;i++}
    }
  }
  const apply=k=>{for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(!fn[y][x]&&MASKS[k](x,y))mod[y][x]=!mod[y][x]};
  let best=0,low=Infinity;
  for(let k=0;k<8;k++){apply(k);format(k);const p=penalty(mod);if(p<low){low=p;best=k}apply(k)}
  apply(best);format(best);
  return mod;
}
function draw(canvas,text,size){
  const m=encode(text),quiet=4,cells=m.length+quiet*2,s=Math.floor((size||1024)/cells),px=s*cells,c=canvas.getContext('2d');
  canvas.width=canvas.height=px;
  c.fillStyle='#fff';c.fillRect(0,0,px,px);c.fillStyle='#0c171e';
  m.forEach((row,y)=>row.forEach((d,x)=>{if(d)c.fillRect((x+quiet)*s,(y+quiet)*s,s,s)}));
}
root.JGIQR={encode,draw};
})(typeof window!=='undefined'?window:globalThis);
