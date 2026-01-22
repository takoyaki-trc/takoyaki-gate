(() => {
/* =====================================================
   TAKOFISH FINAL GAME
   ===================================================== */

const CDN_BASE = "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/";
const IMG = {
  pick: CDN_BASE+"pick.png",
  sauce: CDN_BASE+"tako_sauce.png",
  ika: CDN_BASE+"tako_ika.png",
  gold: CDN_BASE+"tako_gold.png",
  rainbow: CDN_BASE+"tako_rainbow.png",
  raw: CDN_BASE+"tako_raw.png",
};

// ===================== モーダル =====================
function modalHTML(){
return `
<div id="tfModal" style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999">
 <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
 background:#111;border:3px solid #fff;width:380px">
  <div style="padding:6px;color:#fff;text-align:center;font-weight:bold">
   たこ焼き釣り
   <button id="tfClose" style="float:right">×</button>
  </div>
  <canvas id="tfCanvas" width="360" height="520"></canvas>
 </div>
</div>`;
}

window.openTakofishGame = () => {
 if(document.getElementById("tfModal")) return;
 document.body.insertAdjacentHTML("beforeend", modalHTML());
 document.getElementById("tfClose").onclick = () =>
   document.getElementById("tfModal").remove();
 startGame();
};

// ===================== 画像ロード =====================
function load(src){
 return new Promise(res=>{
  const i=new Image();
  i.onload=()=>res(i);
  i.src=src;
 });
}

async function startGame(){
 const cvs=document.getElementById("tfCanvas");
 const ctx=cvs.getContext("2d");
 ctx.imageSmoothingEnabled=false;

 const images={};
 for(const k in IMG) images[k]=await load(IMG[k]);

 const W=cvs.width,H=cvs.height;
 let score=0,time=30;

 // ===== たこ焼き =====
 const TAKOS=[];
 function spawnTako(){
  const r=Math.random();
  let type="sauce",pt=10,img=images.sauce;
  if(r<0.10){type="raw";pt=-20;img=images.raw;}
  else if(r<0.15){type="rainbow";pt=300;img=images.rainbow;}
  else if(r<0.25){type="gold";pt=150;img=images.gold;}
  else if(r<0.45){type="ika";pt=60;img=images.ika;}

  let size=1;
  if(Math.random()<0.15) size=0.5;
  else if(Math.random()<0.15) size=1.8;

  TAKOS.push({
    x:Math.random()*W,
    y:H-40,
    vx:(Math.random()*2-1)*20,
    size,pt,img,hooked:false
  });
 }

 for(let i=0;i<6;i++) spawnTako();

 // ===== フック =====
 let hook=null;

 cvs.onclick=e=>{
  const rect=cvs.getBoundingClientRect();
  hook={x:e.clientX-rect.left,y:0,vy:8,target:null};
 };

 // ===== 天敵 =====
 const ENEMIES=[
  {y:H*0.7,v:15,w:40},
  {y:H*0.45,v:40,w:36},
  {y:H*0.25,v:80,w:24},
 ];
 const FAST={active:false,x:W,y:H*0.4,v:400,next:performance.now()+10000};

 // ===================== ループ =====================
 let last=performance.now();
 function loop(now){
  const dt=(now-last)/1000; last=now;
  ctx.fillStyle="#001"; ctx.fillRect(0,0,W,H);

  // タイマー
  ctx.fillStyle="#fff"; ctx.fillText(`Score:${score}  Time:${time}`,10,16);

  // たこ焼き
  TAKOS.forEach(t=>{
    t.x+=t.vx*dt;
    if(t.x<0||t.x>W) t.vx*=-1;
    ctx.drawImage(t.img,t.x-16*t.size,t.y-16*t.size,32*t.size,32*t.size);
  });

  // フック
  if(hook){
    hook.y+=hook.vy;
    ctx.drawImage(images.pick,hook.x-8,hook.y,16,32);

    TAKOS.forEach(t=>{
      if(!t.hooked && Math.hypot(t.x-hook.x,t.y-hook.y)<20){
        t.hooked=true; hook.target=t;
      }
    });

    if(hook.target){
      hook.target.y-=4;
      hook.y-=4;
      if(hook.target.y<40){
        score+=hook.target.pt;
        TAKOS.splice(TAKOS.indexOf(hook.target),1);
        spawnTako();
        hook=null;
      }
    }
    if(hook && hook.y>H) hook=null;
  }

  // 天敵
  ENEMIES.forEach(e=>{
    e.x=(e.x||0)+e.v*dt;
    if(e.x>W||e.x<0) e.v*=-1;
    ctx.fillStyle="#900";
    ctx.fillRect(e.x,e.y,e.w,12);

    TAKOS.forEach(t=>{
      if(Math.abs(t.x-e.x)<20 && Math.abs(t.y-e.y)<10){
        TAKOS.splice(TAKOS.indexOf(t),1);
        spawnTako();
      }
    });
  });

  // 超高速天敵
  if(now>FAST.next){
    FAST.active=true; FAST.x=W; FAST.next=now+10000+Math.random()*5000;
  }
  if(FAST.active){
    FAST.x-=FAST.v*dt;
    ctx.fillStyle="#f00"; ctx.fillRect(FAST.x,FAST.y,50,6);
    if(FAST.x<-60) FAST.active=false;
  }

  requestAnimationFrame(loop);
 }

 setInterval(()=>time--,1000);
 requestAnimationFrame(loop);
}
})();

  // 入口タコ民を押したら起動
  const entry = document.querySelector(".takomin--fish");
  if (entry){
    entry.addEventListener("click", (e) => {
      e.preventDefault();
      window.openTakofishGame();
    });
  }
