(() => {
  /* =========================================================
     TAKOFISH.js（完全版：画像天敵/ルール画面/延長＆鬼モード）
     - 入口：window.openTakofishGame()
     - 画像：GitHub(jsDelivr)
       assets/takofish/
         pick.png
         tako_sauce.png / tako_ika.png / tako_gold.png / tako_rainbow.png / tako_raw.png
         tourist_left.png / tourist_right.png
         ika.png  ← 下天敵イカ
     ========================================================= */

  /* ===== GitHub(jsDelivr)画像 ===== */
  const CDN_BASE = "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/";
  const V = "1"; // 画像更新したら 2,3...（キャッシュ対策）

  const IMG_URLS = {
    pick:          `${CDN_BASE}pick.png?v=${V}`,
    sauce:         `${CDN_BASE}tako_sauce.png?v=${V}`,
    ika_tako:      `${CDN_BASE}tako_ika.png?v=${V}`,
    gold:          `${CDN_BASE}tako_gold.png?v=${V}`,
    rainbow:       `${CDN_BASE}tako_rainbow.png?v=${V}`,
    raw:           `${CDN_BASE}tako_raw.png?v=${V}`,
    tourist_left:  `${CDN_BASE}tourist_left.png?v=${V}`,
    tourist_right: `${CDN_BASE}tourist_right.png?v=${V}`,
    squid:         `${CDN_BASE}ika.png?v=${V}`, // ✅ 下天敵イカ
  };

  /* ===== モーダルHTML（ルール画面付き） ===== */
  function buildModalHTML(){
    return `
<div id="tfModal" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.78);">
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
              width:min(460px,94vw);background:#111;border:3px solid #fff;border-radius:12px;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#000;color:#fff;">
      <div style="font-weight:800;">たこ焼き釣り</div>
      <button id="tfClose" type="button" aria-label="閉じる"
              style="font-size:18px;line-height:1;border:2px solid #fff;background:#000;color:#fff;border-radius:8px;padding:2px 10px;cursor:pointer;">×</button>
    </div>

    <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 10px;background:#111;border-top:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;">
      <button id="tfRetry" type="button"
              style="border:2px solid #fff;background:#000;color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">もう一回</button>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
        <span>スコア：<b id="tfScore">0</b></span>
        <span>残り：<b id="tfTime">--</b>s</span>
        <span>連続：<b id="tfCombo">0</b></span>
        <span>失敗：<b id="tfMiss">0</b></span>
      </div>
    </div>

    <div style="background:#000;border-top:1px solid rgba(255,255,255,.15);position:relative;">
      <canvas id="tfCanvas" width="360" height="520"
              style="display:block;width:100%;height:auto;image-rendering:pixelated;"></canvas>

      <!-- ✅ ルール画面（開始前） -->
      <div id="tfRules" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);">
        <div style="width:min(380px,92%);max-height:78%;overflow:auto;background:#0b0f18;border:2px solid #fff;border-radius:12px;padding:12px;color:#fff;font-size:12px;line-height:1.5;">
          <div style="font-weight:900;font-size:14px;margin-bottom:6px;">ルール</div>
          <div style="opacity:.9;margin-bottom:10px;">
            タップした場所に糸（ピック）を垂らして、たこ焼きに当てて釣り上げよう。<br>
            天敵にぶつかると奪われる。生焼けはマイナス。
          </div>

          <div style="font-weight:800;margin:8px 0 4px;">基本点（サイズ）</div>
          <div style="opacity:.9">
            極小：<b>120</b> / 普通：<b>70</b> / 巨大：<b>40</b><br>
            ※小さいほど高い。巨大は運が悪いと途中で落ちることがある。
          </div>

          <div style="font-weight:800;margin:10px 0 4px;">種類（倍率 or マイナス）</div>
          <div style="opacity:.9">
            ソース：×<b>1.00</b>（基本）<br>
            いかさま：×<b>1.40</b><br>
            ゴールド：×<b>2.80</b><br>
            レインボー：×<b>5.50</b><br>
            生焼け：<b>-120</b>（ハズレ）
          </div>

          <div style="font-weight:800;margin:10px 0 4px;">出現率</div>
          <div style="opacity:.9">
            ソース55% / いかさま20% / ゴールド10% / レインボー5% / 生焼け10%
          </div>

          <div style="font-weight:800;margin:10px 0 4px;">制限時間（おすすめ仕様）</div>
          <div style="opacity:.9">
            まず<b>30秒</b>。30秒時点でスコアが<b id="tfUnlockScoreTxt">600</b>点以上なら、<b>60秒</b>まで延長！<br>
            さらに<b>45秒</b>から<b>鬼モード</b>（天敵が激しくなる）
          </div>

          <div style="display:flex;gap:8px;margin-top:12px;">
            <button id="tfStartBtn" type="button"
              style="flex:1;border:2px solid #fff;background:#000;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font-weight:800;">
              スタート
            </button>
            <button id="tfSkipBtn" type="button"
              style="border:2px solid rgba(255,255,255,.5);background:transparent;color:#fff;border-radius:10px;padding:10px;cursor:pointer;">
              閉じる
            </button>
          </div>
          <div style="opacity:.6;margin-top:8px;font-size:11px;">
            ※スマホはスクロールできます
          </div>
        </div>
      </div>
    </div>

    <div style="padding:8px 10px;color:#aaa;font-size:11px;background:#111;border-top:1px solid rgba(255,255,255,.15);">
      タップで糸を落下 → 当てる → 巻き上げ。天敵に当たると奪われる。
    </div>
  </div>
</div>`;
  }

  function openGame(){
    if (document.getElementById("tfModal")) return;

    document.body.insertAdjacentHTML("beforeend", buildModalHTML());

    const modal = document.getElementById("tfModal");
    document.getElementById("tfClose").addEventListener("click", closeGame);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeGame(); });

    document.getElementById("tfRetry").addEventListener("click", () => initAndShowRules().catch(console.error));
    document.getElementById("tfSkipBtn").addEventListener("click", closeGame);

    initAndShowRules().catch(console.error);
  }

  function closeGame(){
    stopGame();
    const m = document.getElementById("tfModal");
    if (m) m.remove();
  }

  window.openTakofishGame = openGame;

  /* ===== 画像ロード ===== */
  function loadImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
  }

  async function loadAllImages(){
    const keys = Object.keys(IMG_URLS);
    const images = {};
    const failed = [];
    for (const k of keys){
      try { images[k] = await loadImage(IMG_URLS[k]); }
      catch(e){ failed.push({ key:k, url:String(e.message || e) }); }
    }
    return { images, failed };
  }

  /* ===== ゲーム状態 ===== */
  let rafId = null;
  let timerId = null;
  let onPointer = null;

  // ゲーム内共有（initAndShowRules→startGameへ渡す）
  let GAME_BOOT = null;

  function stopGame(){
    if (timerId) clearInterval(timerId);
    timerId = null;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    const cvs = document.getElementById("tfCanvas");
    if (cvs && onPointer) cvs.removeEventListener("pointerdown", onPointer);
    onPointer = null;

    GAME_BOOT = null;
  }

  async function initAndShowRules(){
    stopGame();

    const cvs = document.getElementById("tfCanvas");
    const ctx = cvs.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const W = cvs.width, H = cvs.height;

    // ロード中表示
    ctx.fillStyle = "#0a1020"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#fff"; ctx.font = "16px system-ui";
    ctx.fillText("画像を読み込み中…", 100, 260);

    const { images, failed } = await loadAllImages();
    if (failed.length){
      ctx.fillStyle="#0a1020"; ctx.fillRect(0,0,W,H);
      ctx.fillStyle="#fff"; ctx.font="14px system-ui";
      ctx.fillText("画像が読み込めないものがあります：", 20, 40);
      ctx.font="11px system-ui";
      let y=70;
      for (const f of failed){
        ctx.fillText(`- ${f.key}: ${f.url}`, 20, y);
        y += 16;
        if (y > H - 30) break;
      }
      ctx.fillText("CDN_BASE / ファイル名を確認してください。", 20, H-16);
      return;
    }

    // ルール画面表示（Startで開始）
    const rules = document.getElementById("tfRules");
    rules.style.display = "flex";

    // ルール内の閾値表示
    const unlockTxt = document.getElementById("tfUnlockScoreTxt");
    unlockTxt.textContent = String(UNLOCK_SCORE);

    // boot保持
    GAME_BOOT = { images };

    document.getElementById("tfStartBtn").onclick = () => {
      rules.style.display = "none";
      startGame(GAME_BOOT.images);
    };
  }

  /* =========================================================
     ✅ ここからゲーム本体
     ========================================================= */

  // ★相談の結論：かなり良い案
  // 30秒で「上手い人だけ延長」は “飽き対策＆達成感” が両立するので◎
  // さらに45秒鬼モードは “後半の緊張感” を作れてかなり映える
  // → 今回コードに実装済み

  // ✅ 30秒→60秒の延長条件（ここだけ好みで）
  const UNLOCK_SCORE = 600;

  function startGame(images){
    // DOM
    const scoreEl = document.getElementById("tfScore");
    const timeEl  = document.getElementById("tfTime");
    const comboEl = document.getElementById("tfCombo");
    const missEl  = document.getElementById("tfMiss");

    const cvs = document.getElementById("tfCanvas");
    const ctx = cvs.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const W = cvs.width;
    const H = cvs.height;

    /* ==========================
       設定（必要ならここだけ調整）
    ========================== */
    const ITEM_COUNT = 7;

    // 生き物っぽい底移動
    const ITEM_BASE_SPEED = 45;
    const ITEM_MAX_SPEED  = 130;
    const ITEM_ACCEL      = 240;

    // フック
    const HOOK_DROP_SPEED = 680;
    const HOOK_REEL_SPEED = 260;
    const HOOK_HIT_R      = 10;

    // 描画サイズ
    const PICK_DRAW = 24;
    const TAKO_TINY   = 24;
    const TAKO_NORMAL = 40;
    const TAKO_GIANT  = 56;

    // 巨大落下
    const GIANT_DROP_CHANCE = 0.18;
    const GIANT_DROP_START_Y = Math.floor(H * 0.62);

    // 天敵（上：観光客、下：イカ）
    const FLOOR_Y = Math.floor(H * 0.86);
    const TOP_Y   = 18;
    const SAFE_MARGIN_X = 10;

    const ENEMY_CENTER_Y = Math.floor(H * 0.45);
    const ENEMY_GAP = 170;

    const TOURIST_Y = ENEMY_CENTER_Y - Math.floor(ENEMY_GAP * 0.55);
    const SQUID_Y   = ENEMY_CENTER_Y + Math.floor(ENEMY_GAP * 0.55);

    const TOURIST_SPEED = 90;

    // ✅ 下イカ：ゆっくり＆ゆらゆら（変更点①）
    const SQUID_SPEED = 18;     // 横移動の基準（遅いほどゆっくり）
    const SQUID_WOB_AMP_Y = 16; // 上下ゆらゆら幅
    const SQUID_WOB_AMP_X = 10; // 横方向のゆらゆら（ジグザグじゃなく漂う感じ）
    const SQUID_WOB_FREQ  = 0.55;

    // 画像サイズ（当たり判定は w/h）
    const TOURIST_W = 34;
    const TOURIST_H = 18;

    const SQUID_W = 58;
    const SQUID_H = 58;

    // 超高速天敵（右→左で消える）
    let DASH_MIN_SEC = 10;
    let DASH_MAX_SEC = 15;
    let DASH_SPEED   = 900;
    const DASH_W      = 40;
    const DASH_H      = 14;
    const DASH_Y      = Math.floor((TOURIST_Y + SQUID_Y) * 0.5) - 12;

    // 出現率（55/20/10/5/10）
    const TYPE_WEIGHTS = [
      { key:"sauce",   w:55 },
      { key:"ika",     w:20 },
      { key:"gold",    w:10 },
      { key:"rainbow", w: 5 },
      { key:"raw",     w:10 },
    ];

    const SIZE_WEIGHTS = [
      { key:"normal", w:62 },
      { key:"tiny",   w:28 },
      { key:"giant",  w:10 },
    ];
    /* ========================== */

    // util
    const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
    const rand  = (a,b)=>a+Math.random()*(b-a);

    function circleHit(ax, ay, ar, bx, by, br){
      const dx=ax-bx, dy=ay-by;
      return (dx*dx+dy*dy) <= (ar+br)*(ar+br);
    }
    function circleRectHit(cx, cy, cr, rx, ry, rw, rh){
      const nx = clamp(cx, rx, rx+rw);
      const ny = clamp(cy, ry, ry+rh);
      const dx = cx-nx, dy = cy-ny;
      return (dx*dx+dy*dy) <= cr*cr;
    }
    function pickByWeight(list){
      let sum=0; for(const it of list) sum += it.w;
      let r=Math.random()*sum;
      for(const it of list){ r-=it.w; if(r<=0) return it.key; }
      return list[list.length-1].key;
    }

    // ===================== スコア/時間（変更点②＋相談案実装）
    let score=0, combo=0, miss=0;
    let elapsed=0;       // 経過秒
    let limit=30;        // 最初は30秒
    let unlocked=false;  // 60秒解放
    let oni=false;       // 45秒〜鬼モード

    function remaining(){ return Math.max(0, limit - elapsed); }

    // ===================== ルール用パラメータ（表示と一致）
    const SIZE_TABLE = {
      tiny:   { label:"極小",  draw: TAKO_TINY,   base:120 },
      normal: { label:"普通",  draw: TAKO_NORMAL, base:70  },
      giant:  { label:"巨大",  draw: TAKO_GIANT,  base:40  },
    };

    const TYPE_TABLE = {
      sauce:   { label:"ソース",     mult:1.00, kind:"plus",  imgKey:"sauce" },
      ika:     { label:"いかさま",   mult:1.40, kind:"plus",  imgKey:"ika_tako" },
      gold:    { label:"ゴールド",   mult:2.80, kind:"plus",  imgKey:"gold" },
      rainbow: { label:"レインボー", mult:5.50, kind:"plus",  imgKey:"rainbow" },
      raw:     { label:"生焼け",     mult:0.00, kind:"minus", imgKey:"raw", penalty:-120 },
    };

    function buildTakoyakiSpec(){
      const sizeKey = pickByWeight(SIZE_WEIGHTS);
      const typeKey = pickByWeight(TYPE_WEIGHTS);
      const size = SIZE_TABLE[sizeKey];
      const type = TYPE_TABLE[typeKey];

      let points=0;
      if(type.kind==="minus") points = type.penalty;
      else points = Math.round(size.base * type.mult);

      return { sizeKey, size, type, points };
    }

    // ===================== たこ焼き（底で生き物っぽく）
    const items=[];
    for(let i=0;i<ITEM_COUNT;i++){
      const spec = buildTakoyakiSpec();
      const baseY = (FLOOR_Y - 14) + rand(-2,2);
      items.push({
        x: rand(W*0.15, W*0.85),
        baseY,
        y: baseY,
        alive:true,
        spec,
        vx: (Math.random()<0.5?-1:1) * (ITEM_BASE_SPEED + rand(0,22)),
        vxTarget: (Math.random()<0.5?-1:1) * (ITEM_BASE_SPEED + rand(0,50)),
        bobAmp: rand(0.6,2.4),
        bobSpd: rand(3.0,7.8),
        bobPhase: rand(0,Math.PI*2),
        nextMind: performance.now()+rand(450,1100),
        pauseUntil: 0,
      });
    }

    function resetItem(it){
      it.spec = buildTakoyakiSpec();
      const baseY = (FLOOR_Y - 14) + rand(-2,2);
      it.x = rand(W*0.15, W*0.85);
      it.baseY = baseY;
      it.y = baseY;
      it.alive = true;
      it.vx = (Math.random()<0.5?-1:1) * (ITEM_BASE_SPEED + rand(0,22));
      it.vxTarget = (Math.random()<0.5?-1:1) * (ITEM_BASE_SPEED + rand(0,50));
      it.bobAmp = rand(0.6,2.4);
      it.bobSpd = rand(3.0,7.8);
      it.bobPhase = rand(0,Math.PI*2);
      it.nextMind = performance.now()+rand(450,1100);
      it.pauseUntil = 0;
    }

    // ===================== フック
    const hook = {
      x: W*0.5,
      y: TOP_Y,
      hitR: HOOK_HIT_R,
      phase:"idle", // idle | drop | reel
      hasCatch:false,
      caught:null,  // spec
      giantDropArmed:false,
      giantDropRolled:false,
      giantWillDrop:false,
    };

    function setHookIdle(){
      hook.phase="idle";
      hook.y=TOP_Y;
      hook.hasCatch=false;
      hook.caught=null;
      hook.giantDropArmed=false;
      hook.giantDropRolled=false;
      hook.giantWillDrop=false;
    }

    // ===================== 天敵（観光客 上）
    const tourist = {
      x: 0,
      y: TOURIST_Y,
      w: TOURIST_W,
      h: TOURIST_H,
      dir: 1,
      speed: TOURIST_SPEED,
    };

    // ===================== 天敵（イカ 下：漂うゆらゆら）
    const squid = {
      baseY: SQUID_Y,
      baseX: W - SQUID_W,
      x: W - SQUID_W,
      y: SQUID_Y,
      w: SQUID_W,
      h: SQUID_H,
      dir: -1,
      speed: SQUID_SPEED,
      ampY: SQUID_WOB_AMP_Y,
      ampX: SQUID_WOB_AMP_X,
      freq: SQUID_WOB_FREQ,
      phase: Math.random()*Math.PI*2
    };

    // ===================== 超高速天敵（右→左）
    const dash = {
      active:false,
      x: W + 40,
      y: DASH_Y,
      w: DASH_W,
      h: DASH_H,
      vx: -DASH_SPEED,
      nextAt: performance.now() + (DASH_MIN_SEC*1000 + Math.random()*(DASH_MAX_SEC-DASH_MIN_SEC)*1000),
    };

    // フラッシュ表示
    let flashMsg="", flashUntil=0;
    function flashText(msg, ms){
      flashMsg = msg;
      flashUntil = performance.now() + ms;
    }

    function spawnDash(now){
      dash.active = true;
      dash.x = W + dash.w + 8;
      dash.vx = -DASH_SPEED;

      // ✅ 鬼モードは頻度UP
      const minS = oni ? 4 : DASH_MIN_SEC;
      const maxS = oni ? 7 : DASH_MAX_SEC;

      dash.nextAt = now + (minS*1000 + Math.random()*(maxS-minS)*1000);
      flashText("⚠ 超高速天敵！", 550);
    }
    function despawnDash(){
      dash.active=false;
      dash.x = W + dash.w + 8;
    }

    // ===================== 得点処理
    function applyCatchScore(spec){
      if(spec.type.kind==="minus"){
        score += spec.points;
        combo = 0;
        miss++;
        flashText(`ハズレ！${spec.type.label} ${spec.points}`, 1000);
        return;
      }

      combo++;
      const comboBonus = Math.min(120, combo*6);
      score += spec.points + comboBonus;

      flashText(`GET! +${spec.points}（${spec.size.label}/${spec.type.label}）`, 900);
    }

    function onStolen(by){
      combo=0;
      miss++;
      if(by==="squid"){
        // 裏市場的に “回収” 感：少し減点しても面白い
        score -= 40;
        flashText("イカに奪われた… -40", 1000);
      }else{
        flashText("観光客に横取りされた！", 900);
      }
      setHookIdle();
    }

    function onDropGiant(){
      combo=0;
      miss++;
      flashText("巨大たこ焼き、落ちた！！", 1000);
      setHookIdle();
    }

    // ===================== 入力
    function pointerToCanvasX(e){
      const rect = cvs.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      return clamp(x, SAFE_MARGIN_X, W - SAFE_MARGIN_X);
    }
    function startDropAt(x){
      if(remaining()<=0) return;
      if(hook.phase!=="idle") return;

      hook.x = clamp(x, SAFE_MARGIN_X, W - SAFE_MARGIN_X);
      hook.phase = "drop";
      hook.hasCatch = false;
      hook.caught = null;
      hook.giantDropArmed=false;
      hook.giantDropRolled=false;
      hook.giantWillDrop=false;
    }

    onPointer = (e) => { e.preventDefault(); startDropAt(pointerToCanvasX(e)); };
    cvs.addEventListener("pointerdown", onPointer);

    // ===================== 描画
    function drawImageCentered(img, x, y, size){
      ctx.drawImage(img, Math.round(x - size/2), Math.round(y - size/2), size, size);
    }

    function drawBackground(){
      ctx.fillStyle = "#0a1020";
      ctx.fillRect(0,0,W,H);

      // 底帯
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, FLOOR_Y - 6, W, 6);

      // 鬼モード表示
      if(oni){
        ctx.fillStyle = "rgba(255,60,60,.12)";
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = "rgba(255,60,60,.8)";
        ctx.font = "12px system-ui";
        ctx.fillText("鬼モード", 10, 40);
      }
    }

    function drawItems(){
      for(const it of items){
        if(!it.alive) continue;
        const img = images[it.spec.type.imgKey];
        drawImageCentered(img, it.x, it.y, it.spec.size.draw);
      }
    }

    function drawTourist(){
      const img = tourist.dir > 0 ? images.tourist_right : images.tourist_left;
      drawImageCentered(img, tourist.x + tourist.w/2, tourist.y, Math.max(tourist.w, tourist.h));
    }

    function drawSquid(){
      // 左右反転（dir=-1で左向き）
      const img = images.squid;
      const cx = squid.x + squid.w/2;
      const cy = squid.y;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(squid.dir, 1);
      ctx.drawImage(img, Math.round(-squid.w/2), Math.round(-squid.h/2), squid.w, squid.h);
      ctx.restore();
    }

    function drawDash(){
      if(!dash.active) return;
      const ex = Math.round(dash.x);
      const ey = Math.round(dash.y - dash.h/2);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(ex, ey, dash.w, dash.h);
      ctx.fillStyle = "#111";
      ctx.fillRect(ex + dash.w - 8, ey + 4, 7, 6);
    }

    function drawHook(){
      // 糸
      ctx.strokeStyle = "rgba(255,255,255,.25)";
      ctx.beginPath();
      ctx.moveTo(hook.x, TOP_Y);
      ctx.lineTo(hook.x, hook.y);
      ctx.stroke();

      // ピック
      drawImageCentered(images.pick, hook.x, hook.y, PICK_DRAW);

      // 釣れてるたこ焼き
      if(hook.hasCatch && hook.caught){
        const s = hook.caught.size.draw;
        const ty = hook.y + (PICK_DRAW/2) + (s/2) - 2;
        const img = images[hook.caught.type.imgKey];
        drawImageCentered(img, hook.x, ty, s);
      }
    }

    function drawHUD(now){
      ctx.fillStyle = "#fff";
      ctx.font = "13px system-ui";

      if(hook.phase==="idle") ctx.fillText("タップ：好きな位置に糸を垂らす", 10, 18);
      else if(hook.phase==="drop") ctx.fillText("落下中…当てろ！", 10, 18);
      else ctx.fillText("巻き上げ中！天敵＆巨大落下に注意！", 10, 18);

      // フラッシュ
      if(now < flashUntil && flashMsg){
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.fillRect(0, 28, W, 28);
        ctx.fillStyle = "#fff";
        ctx.font = "14px system-ui";
        ctx.fillText(flashMsg, 12, 48);
      }

      // TIME UP
      if(remaining()<=0){
        ctx.fillStyle = "rgba(0,0,0,.65)";
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = "#fff";
        ctx.font = "22px system-ui";
        ctx.fillText("TIME UP!", 120, 230);
      }
    }

    function render(now){
      drawBackground();
      drawTourist();
      drawSquid();
      drawDash();

      if(!hook.hasCatch) drawItems();
      drawHook();
      drawHUD(now);
    }

    // ===================== ループ
    let last = performance.now();

    function step(now){
      const dt = Math.min(0.033, (now - last)/1000);
      last = now;

      if(remaining() > 0){
        // ---- たこ焼きの生き物挙動
        for(const it of items){
          if(!it.alive) continue;

          if(now < it.pauseUntil){
            it.vx *= 0.90;
          }else{
            if(now >= it.nextMind){
              if(Math.random() < 0.10){
                it.pauseUntil = now + rand(260, 620);
              }

              const flip = (Math.random() < 0.18) ? -1 : 1;
              const spd = ITEM_BASE_SPEED + rand(-18, 60);
              it.vxTarget = clamp(flip * (Math.random()<0.5?-1:1) * spd, -ITEM_MAX_SPEED, ITEM_MAX_SPEED);

              it.bobAmp = clamp(it.bobAmp + rand(-0.6, 0.9), 0.5, 3.4);
              it.bobSpd = clamp(it.bobSpd + rand(-1.2, 1.4), 2.0, 9.0);

              it.nextMind = now + rand(350, 1300);
            }

            const dv = it.vxTarget - it.vx;
            const stepV = clamp(dv, -ITEM_ACCEL*dt, ITEM_ACCEL*dt);
            it.vx += stepV;

            it.vx += rand(-6, 6) * dt;
            it.vx = clamp(it.vx, -ITEM_MAX_SPEED, ITEM_MAX_SPEED);
          }

          it.x += it.vx * dt;

          const half = it.spec.size.draw/2;
          if(it.x - half < SAFE_MARGIN_X){
            it.x = SAFE_MARGIN_X + half;
            it.vx = Math.abs(it.vx) * (0.85 + Math.random()*0.25);
            it.vxTarget = Math.abs(it.vxTarget) * (0.8 + Math.random()*0.4);
            it.nextMind = Math.min(it.nextMind, now + rand(120, 420));
          }
          if(it.x + half > W - SAFE_MARGIN_X){
            it.x = (W - SAFE_MARGIN_X) - half;
            it.vx = -Math.abs(it.vx) * (0.85 + Math.random()*0.25);
            it.vxTarget = -Math.abs(it.vxTarget) * (0.8 + Math.random()*0.4);
            it.nextMind = Math.min(it.nextMind, now + rand(120, 420));
          }

          it.y = it.baseY + Math.sin((now/1000)*it.bobSpd + it.bobPhase) * it.bobAmp;
        }

        // ---- 観光客（往復）
        tourist.x += tourist.dir * tourist.speed * dt;
        if(tourist.x < 0){ tourist.x = 0; tourist.dir *= -1; }
        if(tourist.x + tourist.w > W){ tourist.x = W - tourist.w; tourist.dir *= -1; }

        // ---- ✅ 下イカ（変更点①：横移動＋ゆらゆら）
        squid.baseX += squid.dir * squid.speed * dt;
        if(squid.baseX < 0){ squid.baseX = 0; squid.dir *= -1; }
        if(squid.baseX + squid.w > W){ squid.baseX = W - squid.w; squid.dir *= -1; }

        const sec = (now/1000) * (Math.PI*2) * squid.freq + squid.phase;
        squid.x = squid.baseX + Math.sin(sec) * squid.ampX;
        squid.y = squid.baseY + Math.cos(sec * 0.85) * squid.ampY;

        // ---- 30秒→60秒解放判定
        // tick側で判定するが、表示用にここで鬼モードも反映
        oni = unlocked && elapsed >= 45;

        // 鬼モード：天敵を強化（頻度UP + スピード微UP）
        if(oni){
          tourist.speed = TOURIST_SPEED * 1.25;
          squid.speed   = SQUID_SPEED   * 1.25;
          DASH_SPEED    = 1050;
          dash.vx       = -DASH_SPEED;
        } else {
          tourist.speed = TOURIST_SPEED;
          squid.speed   = SQUID_SPEED;
          DASH_SPEED    = 900;
          dash.vx       = -DASH_SPEED;
        }

        // ---- 超高速天敵
        if(!dash.active && now >= dash.nextAt){
          spawnDash(now);
        }
        if(dash.active){
          dash.x += dash.vx * dt;
          if(dash.x + dash.w < -10) despawnDash();
        }

        // ---- フック：落下
        if(hook.phase === "drop"){
          hook.y += HOOK_DROP_SPEED * dt;

          if(!hook.hasCatch){
            for(const it of items){
              if(!it.alive) continue;
              const s = it.spec.size.draw;
              const rr = s * 0.38;
              if(circleHit(hook.x, hook.y, hook.hitR, it.x, it.y, rr)){
                hook.hasCatch = true;
                hook.phase = "reel";
                hook.caught = it.spec;

                hook.giantDropArmed  = (it.spec.sizeKey === "giant");
                hook.giantDropRolled = false;
                hook.giantWillDrop   = false;

                it.alive = false;
                flashText(`HIT!（${it.spec.size.label}/${it.spec.type.label}）`, 800);
                break;
              }
            }
          }

          if(hook.y >= FLOOR_Y - 10){
            hook.y = FLOOR_Y - 10;
            hook.phase = "reel";
            if(!hook.hasCatch){
              combo = 0;
              flashText("空振り…！", 650);
            }
          }
        }

        // ---- フック：巻き上げ
        if(hook.phase === "reel"){
          hook.y -= HOOK_REEL_SPEED * dt;

          // 巨大落下
          if(hook.hasCatch && hook.caught && hook.giantDropArmed){
            if(!hook.giantDropRolled && hook.y < GIANT_DROP_START_Y){
              hook.giantDropRolled = true;
              hook.giantWillDrop = (Math.random() < GIANT_DROP_CHANCE);
            }
            if(hook.giantWillDrop && hook.y < (GIANT_DROP_START_Y - 40)){
              const dead = items.find(v => !v.alive);
              if(dead) resetItem(dead);
              hook.hasCatch = false;
              hook.caught = null;
              onDropGiant();
            }
          }

          // 天敵衝突（釣れてる時のみ）
          if(hook.hasCatch && hook.caught){
            const fishSize = hook.caught.size.draw;
            const fishR = fishSize * 0.38;
            const fishX = hook.x;
            const fishY = hook.y + (PICK_DRAW/2) + (fishSize/2) - 2;

            // 観光客
            if(circleRectHit(fishX, fishY, fishR, tourist.x, tourist.y - tourist.h/2, tourist.w, tourist.h)){
              const dead = items.find(v => !v.alive);
              if(dead) resetItem(dead);
              hook.hasCatch = false;
              hook.caught = null;
              onStolen("tourist");
            }

            // イカ（大）
            if(hook.hasCatch && circleRectHit(fishX, fishY, fishR, squid.x, squid.y - squid.h/2, squid.w, squid.h)){
              const dead = items.find(v => !v.alive);
              if(dead) resetItem(dead);
              hook.hasCatch = false;
              hook.caught = null;
              onStolen("squid");
            }

            // 超高速
            if(hook.hasCatch && dash.active){
              if(circleRectHit(fishX, fishY, fishR, dash.x, dash.y - dash.h/2, dash.w, dash.h)){
                const dead = items.find(v => !v.alive);
                if(dead) resetItem(dead);
                hook.hasCatch = false;
                hook.caught = null;
                onStolen("tourist");
                despawnDash();
              }
            }
          }

          // 上まで到達
          if(hook.y <= TOP_Y){
            hook.y = TOP_Y;

            if(hook.hasCatch && hook.caught){
              const dead = items.find(v => !v.alive);
              if(dead) resetItem(dead);

              // スコア付与
              applyCatchScore(hook.caught);

              hook.hasCatch = false;
              hook.caught = null;
              setHookIdle();
            }else{
              setHookIdle();
            }
          }
        }
      }

      // HUD（DOM）
      timeEl.textContent  = String(remaining());
      scoreEl.textContent = String(score);
      comboEl.textContent = String(combo);
      missEl.textContent  = String(miss);

      render(now);
      rafId = requestAnimationFrame(step);
    }

    // ===================== タイマー（1秒刻み）
    timerId = setInterval(() => {
      if(remaining() <= 0) return;

      elapsed++;

      // 30秒到達：延長判定
      if(elapsed === 30){
        if(score >= UNLOCK_SCORE){
          unlocked = true;
          limit = 60; // ✅ 変更点②：60秒へ延長
          flashText(`延長解放！60秒へ（30秒時点 ${score}点）`, 1200);
        }else{
          // 30で終了
          limit = 30;
          flashText(`終了！延長条件：${UNLOCK_SCORE}点（いま ${score}点）`, 1400);
        }
      }

      // 45秒：鬼モード開始（延長した人のみ）
      if(unlocked && elapsed === 45){
        oni = true;
        flashText("鬼モード突入！！", 1000);
      }
    }, 1000);

    // 初期表示
    timeEl.textContent = String(remaining());
    scoreEl.textContent = "0";
    comboEl.textContent = "0";
    missEl.textContent  = "0";
    setHookIdle();

    // start
    rafId = requestAnimationFrame(step);
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
