(() => {
  /* =========================================================
     TAKOFISH — 完全版（確定仕様フル実装）
     - 30秒 → (条件達成で) 60秒へ延長
     - 45秒で鬼モード：0.3秒フリーズ + 背景切替 + 天敵速度2.2倍 + 超高速天敵強化
     - たこ焼き：複数 / 生き物っぽく不規則移動 / サイズ3種 / 種類5種（出現率55/20/10/5/10）
     - 巨大たこ焼き：途中で落ちることがある
     - 天敵：観光客（左右画像）/ イカ（ゆらゆら漂う）
     - 超高速天敵：画像なし（シアン帯＋残像）
     - 開始前：ルール表示（スマホOK）
     - 終了後：ランク名＋一言（～2999点） / 3000点ちょうどは一文のみ
       「それでも、たこ焼きは残らなかった。」
     - 入口：window.openTakofishGame()

     ▼ 画像（GitHub/jsDelivr）配置（assets/takofish/）
       pick.png
       tako_sauce.png
       tako_ika.png
       tako_gold.png
       tako_rainbow.png
       tako_raw.png
       tourist_left.png
       tourist_right.png
       ika.png
  ========================================================= */

  /* ==========================
     0) 画像URL
  ========================== */
  const CDN_BASE = "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/";
  const V = "1"; // 画像を差し替えたら 2,3... に上げる（キャッシュ対策）

  const IMG_URLS = {
    pick:          `${CDN_BASE}pick.png?v=${V}`,
    sauce:         `${CDN_BASE}tako_sauce.png?v=${V}`,
    ika_tako:      `${CDN_BASE}tako_ika.png?v=${V}`,
    gold:          `${CDN_BASE}tako_gold.png?v=${V}`,
    rainbow:       `${CDN_BASE}tako_rainbow.png?v=${V}`,
    raw:           `${CDN_BASE}tako_raw.png?v=${V}`,
    tourist_left:  `${CDN_BASE}tourist_left.png?v=${V}`,
    tourist_right: `${CDN_BASE}tourist_right.png?v=${V}`,
    squid:         `${CDN_BASE}ika.png?v=${V}`,
  };

  /* ==========================
     1) 確定仕様パラメータ
  ========================== */
  const CFG = {
    // canvas
    W: 360,
    H: 520,

    // time / modes
    BASE_LIMIT: 30,
    EXT_LIMIT: 60,
    EXT_SCORE: 600,   // 30秒時点でこれ以上なら延長
    ONI_AT: 45,       // 延長できた人のみ 45秒で鬼
    ONI_FREEZE_MS: 300,
    ONI_SPEED_MUL: 2.2,

    // hook
    HOOK_DROP: 680,
    HOOK_REEL: 260,
    HOOK_HIT_R: 10,
    TOP_Y: 18,
    FLOOR_Y_RATIO: 0.86,

    // pick image draw size
    PICK_DRAW: 24,

    // takoyaki spawn
    ITEM_COUNT: 7,

    // takoyaki “alive” motion
    ITEM_BASE_SPEED: 45,
    ITEM_MAX_SPEED: 130,
    ITEM_ACCEL: 240,

    // giant drop
    GIANT_DROP_CHANCE: 0.18,
    GIANT_DROP_START_Y_RATIO: 0.62,

    // sizes
    SIZE: {
      tiny:   { label: "極小",  draw: 24, base: 120 },
      normal: { label: "普通",  draw: 40, base: 70  },
      giant:  { label: "巨大",  draw: 56, base: 40  },
    },
    SIZE_WEIGHTS: [
      { key: "normal", w: 62 },
      { key: "tiny",   w: 28 },
      { key: "giant",  w: 10 },
    ],

    // types (weights 55/20/10/5/10)
    TYPE: {
      sauce:   { label: "ソース",     mult: 1.00, kind: "plus",  imgKey: "sauce" },
      ika:     { label: "いかさま",   mult: 1.40, kind: "plus",  imgKey: "ika_tako" },
      gold:    { label: "ゴールド",   mult: 2.80, kind: "plus",  imgKey: "gold" },
      rainbow: { label: "レインボー", mult: 5.50, kind: "plus",  imgKey: "rainbow" },
      raw:     { label: "生焼け",     mult: 0.00, kind: "minus", imgKey: "raw", penalty: -120 },
    },
    TYPE_WEIGHTS: [
      { key: "sauce",   w: 55 },
      { key: "ika",     w: 20 },
      { key: "gold",    w: 10 },
      { key: "rainbow", w:  5 },
      { key: "raw",     w: 10 },
    ],

    // enemies layout
    ENEMY_CENTER_Y_RATIO: 0.45,
    ENEMY_GAP: 170,

    // tourist
    TOURIST: { w: 34, h: 18, speed: 90 },

    // squid
    SQUID: { w: 58, h: 58, speed: 18, ampX: 10, ampY: 16, freq: 0.55 },

    // dash (concept streak)
    DASH: {
      yBias: -12,
      w: 54,
      h: 10,
      speed: 950,
      // normal interval
      minS: 10,
      maxS: 15,
      // oni interval
      oniMinS: 4,
      oniMaxS: 7,
      // afterimage count
      trail: 4,
    },

    // safe margin
    MARGIN_X: 10,
  };

  /* ==========================
     2) ランク定義（～3000）
  ========================== */
  const RANKS = [
    { min: 0,    max: 299,  name: "焼き台の前",   line: "まだ、何も始まっていない。" },
    { min: 300,  max: 599,  name: "火のそば",     line: "手は伸びた。" },
    { min: 600,  max: 899,  name: "深みに入った", line: "引き返せる場所ではない。" },
    { min: 900,  max: 1199, name: "流れに触れた", line: "速さが、意味を持ち始める。" },
    { min: 1200, max: 1599, name: "深海を見た",   line: "光は、遠い。" },
    { min: 1600, max: 1999, name: "流れの中",     line: "抗うほど、沈む。" },
    { min: 2000, max: 2499, name: "境界の外",     line: "ここは、想定されていない。" },
    { min: 2500, max: 2999, name: "観測不能",     line: "記録は、残らない。" },
  ];
  const SCORE_3000_LINE = "それでも、たこ焼きは残らなかった。";

  function getRank(score){
    for (const r of RANKS){
      if (score >= r.min && score <= r.max) return r;
    }
    // score 3000+ は特別扱い（3000ぴったり以外も保険）
    return { name: "—", line: "—" };
  }

  /* ==========================
     3) UI（モーダル + ルール + 結果）
  ========================== */
  function buildModalHTML(){
    return `
<div id="tfModal" style="position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.78);">
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
              width:min(520px,94vw);background:#111;border:3px solid #fff;border-radius:12px;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#000;color:#fff;">
      <div style="font-weight:900;">たこ焼き釣り</div>
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
      <canvas id="tfCanvas" width="${CFG.W}" height="${CFG.H}"
              style="display:block;width:100%;height:auto;image-rendering:pixelated;"></canvas>

      <!-- ルール -->
      <div id="tfRules" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);">
        <div style="width:min(420px,92%);max-height:80%;overflow:auto;background:#0b0f18;border:2px solid #fff;border-radius:12px;padding:12px;color:#fff;font-size:12px;line-height:1.55;">
          <div style="font-weight:900;font-size:14px;margin-bottom:6px;">ルール</div>
          <div style="opacity:.9;margin-bottom:10px;">
            タップした場所に糸（ピック）を垂らして、たこ焼きに当てて釣り上げよう。<br>
            天敵にぶつかると奪われる。生焼けはマイナス。
          </div>

          <div style="font-weight:800;margin:8px 0 4px;">基本点（サイズ）</div>
          <div style="opacity:.92">
            極小：<b>120</b> / 普通：<b>70</b> / 巨大：<b>40</b><br>
            ※小さいほど高い。巨大は運が悪いと途中で落ちることがある。
          </div>

          <div style="font-weight:800;margin:10px 0 4px;">種類（倍率 / マイナス）</div>
          <div style="opacity:.92">
            ソース：×<b>1.00</b>（基本）<br>
            いかさま：×<b>1.40</b><br>
            ゴールド：×<b>2.80</b><br>
            レインボー：×<b>5.50</b><br>
            生焼け：<b>-120</b>（ハズレ）
          </div>

          <div style="font-weight:800;margin:10px 0 4px;">出現率</div>
          <div style="opacity:.92">
            ソース55% / いかさま20% / ゴールド10% / レインボー5% / 生焼け10%
          </div>

          <div style="font-weight:800;margin:10px 0 4px;">時間</div>
          <div style="opacity:.92">
            まず<b>30秒</b>。30秒時点でスコアが<b id="tfUnlockTxt">${CFG.EXT_SCORE}</b>点以上なら<b>60秒</b>まで延長。<br>
            延長できた場合、<b>45秒</b>から<b>鬼モード</b>（突入時0.3秒停止・天敵速度2.2倍）
          </div>

          <div style="display:flex;gap:8px;margin-top:12px;">
            <button id="tfStartBtn" type="button"
              style="flex:1;border:2px solid #fff;background:#000;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font-weight:900;">
              スタート
            </button>
            <button id="tfExitBtn" type="button"
              style="border:2px solid rgba(255,255,255,.5);background:transparent;color:#fff;border-radius:10px;padding:10px;cursor:pointer;">
              閉じる
            </button>
          </div>
          <div style="opacity:.6;margin-top:8px;font-size:11px;">
            ※スマホはスクロールできます
          </div>
        </div>
      </div>

      <!-- リザルト -->
      <div id="tfResult" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.78);">
        <div style="width:min(420px,92%);background:#0b0f18;border:2px solid #fff;border-radius:12px;padding:14px;color:#fff;">
          <div id="tfResultTitle" style="font-weight:900;font-size:15px;margin-bottom:6px;">結果</div>
          <div id="tfResultMain" style="font-weight:900;font-size:18px;line-height:1.35;margin:10px 0;"></div>
          <div id="tfResultSub" style="opacity:.92;font-size:12px;line-height:1.6;"></div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button id="tfAgainBtn" type="button"
              style="flex:1;border:2px solid #fff;background:#000;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font-weight:900;">
              もう一回
            </button>
            <button id="tfCloseBtn2" type="button"
              style="border:2px solid rgba(255,255,255,.5);background:transparent;color:#fff;border-radius:10px;padding:10px;cursor:pointer;">
              閉じる
            </button>
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

  /* ==========================
     4) 画像ロード
  ========================== */
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

  /* ==========================
     5) ゲーム本体
  ========================== */
  let rafId = null;
  let timerId = null;
  let onPointer = null;

  // runtime objects
  let IMGS = null;
  let STATE = null;

  function stopGame(){
    if (timerId) clearInterval(timerId);
    timerId = null;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    const cvs = document.getElementById("tfCanvas");
    if (cvs && onPointer) cvs.removeEventListener("pointerdown", onPointer);
    onPointer = null;

    IMGS = null;
    STATE = null;
  }

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function rand(a,b){ return a + Math.random()*(b-a); }

  function pickByWeight(list){
    let sum = 0;
    for (const it of list) sum += it.w;
    let r = Math.random() * sum;
    for (const it of list){
      r -= it.w;
      if (r <= 0) return it.key;
    }
    return list[list.length-1].key;
  }

  function circleHit(ax,ay,ar,bx,by,br){
    const dx=ax-bx, dy=ay-by;
    return (dx*dx+dy*dy) <= (ar+br)*(ar+br);
  }

  function circleRectHit(cx, cy, cr, rx, ry, rw, rh){
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return (dx*dx + dy*dy) <= cr*cr;
  }

  function nowMs(){ return performance.now(); }

  function buildTakoyakiSpec(){
    const sizeKey = pickByWeight(CFG.SIZE_WEIGHTS);
    const typeKey = pickByWeight(CFG.TYPE_WEIGHTS);
    const size = CFG.SIZE[sizeKey];
    const type = CFG.TYPE[typeKey];

    let points = 0;
    if (type.kind === "minus") points = type.penalty;
    else points = Math.round(size.base * type.mult);

    return { sizeKey, size, type, points };
  }

  function pointerToCanvasX(e, cvs){
    const rect = cvs.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CFG.W / rect.width);
    return clamp(x, CFG.MARGIN_X, CFG.W - CFG.MARGIN_X);
  }

  function showResult(score, extended, oniReached){
    const box = document.getElementById("tfResult");
    const main = document.getElementById("tfResultMain");
    const sub  = document.getElementById("tfResultSub");

    const title = document.getElementById("tfResultTitle");
    title.textContent = "結果";

    box.style.display = "flex";

    // 3000点ちょうど：一文のみ
    if (score === 3000){
      main.textContent = SCORE_3000_LINE;
      sub.innerHTML = `<div style="opacity:.75">Score: ${score}</div>`;
      return;
    }

    // 通常ランク
    const r = getRank(score);
    main.textContent = `［ ${r.name} ］`;
    const lines = [];
    lines.push(r.line);
    lines.push(`Score: <b>${score}</b>`);
    lines.push(extended ? "延長：あり（60秒）" : "延長：なし（30秒）");
    if (extended) lines.push(oniReached ? "鬼モード：到達" : "鬼モード：未到達");
    sub.innerHTML = lines.map(s => `<div>${s}</div>`).join("");
  }

  function hideResult(){
    const box = document.getElementById("tfResult");
    box.style.display = "none";
  }

  function flashText(msg, ms){
    STATE.flashMsg = msg;
    STATE.flashUntil = nowMs() + ms;
  }

  function startGame(){
    // DOM
    const cvs = document.getElementById("tfCanvas");
    const ctx = cvs.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const scoreEl = document.getElementById("tfScore");
    const timeEl  = document.getElementById("tfTime");
    const comboEl = document.getElementById("tfCombo");
    const missEl  = document.getElementById("tfMiss");

    const W = CFG.W, H = CFG.H;
    const FLOOR_Y = Math.floor(H * CFG.FLOOR_Y_RATIO);
    const GIANT_DROP_START_Y = Math.floor(H * CFG.GIANT_DROP_START_Y_RATIO);

    // layout for enemies
    const ENEMY_CENTER_Y = Math.floor(H * CFG.ENEMY_CENTER_Y_RATIO);
    const TOURIST_Y = ENEMY_CENTER_Y - Math.floor(CFG.ENEMY_GAP * 0.55);
    const SQUID_Y   = ENEMY_CENTER_Y + Math.floor(CFG.ENEMY_GAP * 0.55);

    // init state
    STATE = {
      // game time
      elapsed: 0,
      limit: CFG.BASE_LIMIT,
      extended: false,
      oni: false,
      oniReached: false,
      freezeUntil: 0,

      // score
      score: 0,
      combo: 0,
      miss: 0,

      // flash
      flashMsg: "",
      flashUntil: 0,

      // entities
      items: [],
      hook: null,
      tourist: null,
      squid: null,
      dash: null,

      // dash trail store
      dashTrail: [],
    };

    function remaining(){
      return Math.max(0, STATE.limit - STATE.elapsed);
    }

    // build items
    for (let i=0; i<CFG.ITEM_COUNT; i++){
      const spec = buildTakoyakiSpec();
      const baseY = (FLOOR_Y - 14) + rand(-2, 2);
      STATE.items.push({
        x: rand(W*0.15, W*0.85),
        baseY,
        y: baseY,
        alive: true,
        spec,
        vx: (Math.random()<0.5?-1:1) * (CFG.ITEM_BASE_SPEED + rand(0,22)),
        vxTarget: (Math.random()<0.5?-1:1) * (CFG.ITEM_BASE_SPEED + rand(0,50)),
        bobAmp: rand(0.6,2.4),
        bobSpd: rand(3.0,7.8),
        bobPhase: rand(0, Math.PI*2),
        nextMind: nowMs() + rand(450,1100),
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
      it.vx = (Math.random()<0.5?-1:1) * (CFG.ITEM_BASE_SPEED + rand(0,22));
      it.vxTarget = (Math.random()<0.5?-1:1) * (CFG.ITEM_BASE_SPEED + rand(0,50));
      it.bobAmp = rand(0.6,2.4);
      it.bobSpd = rand(3.0,7.8);
      it.bobPhase = rand(0,Math.PI*2);
      it.nextMind = nowMs() + rand(450,1100);
      it.pauseUntil = 0;
    }

    // hook
    STATE.hook = {
      x: W*0.5,
      y: CFG.TOP_Y,
      phase: "idle", // idle|drop|reel
      hitR: CFG.HOOK_HIT_R,
      hasCatch: false,
      caught: null, // spec
      // giant drop
      giantDropArmed: false,
      giantDropRolled: false,
      giantWillDrop: false,
    };

    function setHookIdle(){
      const h = STATE.hook;
      h.phase = "idle";
      h.y = CFG.TOP_Y;
      h.hasCatch = false;
      h.caught = null;
      h.giantDropArmed = false;
      h.giantDropRolled = false;
      h.giantWillDrop = false;
    }

    // enemies
    STATE.tourist = {
      x: 0,
      y: TOURIST_Y,
      w: CFG.TOURIST.w,
      h: CFG.TOURIST.h,
      dir: 1, // 1:right, -1:left
      speed: CFG.TOURIST.speed,
    };

    STATE.squid = {
      baseX: W - CFG.SQUID.w,
      baseY: SQUID_Y,
      x: W - CFG.SQUID.w,
      y: SQUID_Y,
      w: CFG.SQUID.w,
      h: CFG.SQUID.h,
      dir: -1,
      speed: CFG.SQUID.speed,
      ampX: CFG.SQUID.ampX,
      ampY: CFG.SQUID.ampY,
      freq: CFG.SQUID.freq,
      phase: Math.random()*Math.PI*2,
    };

    // dash (concept streak)
    const dashY = Math.floor((TOURIST_Y + SQUID_Y) * 0.5) + CFG.DASH.yBias;
    STATE.dash = {
      active: false,
      x: W + 60,
      y: dashY,
      w: CFG.DASH.w,
      h: CFG.DASH.h,
      vx: -CFG.DASH.speed,
      nextAt: nowMs() + (CFG.DASH.minS*1000 + Math.random()*(CFG.DASH.maxS-CFG.DASH.minS)*1000),
    };

    function spawnDash(now){
      const d = STATE.dash;
      d.active = true;
      d.x = W + d.w + 10;
      d.vx = -CFG.DASH.speed * (STATE.oni ? 1.15 : 1.0);

      const minS = STATE.oni ? CFG.DASH.oniMinS : CFG.DASH.minS;
      const maxS = STATE.oni ? CFG.DASH.oniMaxS : CFG.DASH.maxS;
      d.nextAt = now + (minS*1000 + Math.random()*(maxS-minS)*1000);

      // dash trail reset
      STATE.dashTrail.length = 0;

      flashText("⚠ 流れが来た", 520);
    }
    function despawnDash(){
      const d = STATE.dash;
      d.active = false;
      d.x = W + d.w + 10;
    }

    // scoring
    function applyCatchScore(spec){
      if (spec.type.kind === "minus"){
        STATE.score += spec.points;
        STATE.combo = 0;
        STATE.miss++;
        flashText(`ハズレ！${spec.type.label} ${spec.points}`, 900);
        return;
      }
      STATE.combo++;
      const comboBonus = Math.min(120, STATE.combo * 6);
      STATE.score += spec.points + comboBonus;
      flashText(`GET! +${spec.points}（${spec.size.label}/${spec.type.label}）`, 850);
    }

    function onStolen(who){
      STATE.combo = 0;
      STATE.miss++;

      // squidは回収感で-40
      if (who === "squid"){
        STATE.score -= 40;
        flashText("イカに奪われた… -40", 950);
      } else {
        flashText("観光客に横取りされた！", 850);
      }
      setHookIdle();
    }

    function onDropGiant(){
      STATE.combo = 0;
      STATE.miss++;
      flashText("巨大たこ焼き、落ちた！！", 950);
      setHookIdle();
    }

    // input
    function startDropAt(x){
      if (remaining() <= 0) return;
      const h = STATE.hook;
      if (h.phase !== "idle") return;

      h.x = clamp(x, CFG.MARGIN_X, W - CFG.MARGIN_X);
      h.phase = "drop";
      h.hasCatch = false;
      h.caught = null;
      h.giantDropArmed = false;
      h.giantDropRolled = false;
      h.giantWillDrop = false;
    }

    onPointer = (e) => {
      e.preventDefault();
      startDropAt(pointerToCanvasX(e, cvs));
    };
    cvs.addEventListener("pointerdown", onPointer);

    // draw helpers
    function drawImageCentered(img, x, y, size){
      ctx.drawImage(img, Math.round(x - size/2), Math.round(y - size/2), size, size);
    }

    function drawBackground(now){
      // 海っぽい色：通常と鬼で“明確に”違う
      // 通常：夜の海（青）
      // 鬼：深海（青紫）
      const isOni = STATE.oni;

      // base fill
      ctx.fillStyle = isOni ? "#060819" : "#081425";
      ctx.fillRect(0, 0, W, H);

      // subtle gradient bands (no image)
      const t = now / 1000;
      const band1 = Math.floor(40 + 12 * Math.sin(t * 0.6));
      const band2 = Math.floor(70 + 18 * Math.cos(t * 0.42));
      ctx.fillStyle = isOni ? "rgba(120,70,170,0.07)" : "rgba(60,130,220,0.07)";
      ctx.fillRect(0, 0, W, band1);
      ctx.fillRect(0, band1 + 50, W, band2);

      // floor band
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, FLOOR_Y - 6, W, 6);

      // oni overlay (stronger)
      if (isOni){
        ctx.fillStyle = "rgba(0,255,255,0.04)";
        ctx.fillRect(0,0,W,H);
      }
    }

    function drawItems(){
      for (const it of STATE.items){
        if (!it.alive) continue;
        const img = IMGS[it.spec.type.imgKey];
        drawImageCentered(img, it.x, it.y, it.spec.size.draw);
      }
    }

    function drawTourist(){
      const t = STATE.tourist;
      const img = (t.dir > 0) ? IMGS.tourist_right : IMGS.tourist_left;
      // 画像は正方寄りで描く（小さすぎると読めない）
      const size = 44;
      drawImageCentered(img, t.x + t.w/2, t.y, size);
    }

    function drawSquid(){
      const s = STATE.squid;
      const img = IMGS.squid;
      const cx = s.x + s.w/2;
      const cy = s.y;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(s.dir, 1);
      ctx.drawImage(img, Math.round(-s.w/2), Math.round(-s.h/2), s.w, s.h);
      ctx.restore();
    }

    function drawDash(now){
      const d = STATE.dash;
      if (!d.active) return;

      // 更新済み trail を描く（古いほど薄い）
      // trailには過去フレームの {x} が入っている
      const trail = STATE.dashTrail;
      // push current
      trail.unshift({ x: d.x, t: now });
      if (trail.length > CFG.DASH.trail) trail.pop();

      // 描画：帯＋残像
      for (let i=trail.length-1; i>=0; i--){
        const a = (i+1) / (trail.length+1); // 0..1
        const alpha = 0.12 + 0.22 * (1 - a);
        const wid = d.w + i * 14;
        const hi  = d.h + i * 2;

        const x = trail[i].x - i * 10;
        const y = d.y;

        ctx.fillStyle = `rgba(0, 220, 255, ${alpha})`;
        ctx.fillRect(Math.round(x), Math.round(y - hi/2), wid, hi);
      }

      // core
      ctx.fillStyle = "rgba(210, 255, 255, 0.35)";
      ctx.fillRect(Math.round(d.x), Math.round(d.y - d.h/2), d.w, d.h);

      // little edge
      ctx.fillStyle = "rgba(0, 255, 255, 0.35)";
      ctx.fillRect(Math.round(d.x + d.w - 6), Math.round(d.y - d.h/2), 6, d.h);
    }

    function drawHook(){
      const h = STATE.hook;

      // line
      ctx.strokeStyle = "rgba(255,255,255,.22)";
      ctx.beginPath();
      ctx.moveTo(h.x, CFG.TOP_Y);
      ctx.lineTo(h.x, h.y);
      ctx.stroke();

      // pick
      drawImageCentered(IMGS.pick, h.x, h.y, CFG.PICK_DRAW);

      // caught takoyaki
      if (h.hasCatch && h.caught){
        const s = h.caught.size.draw;
        const ty = h.y + (CFG.PICK_DRAW/2) + (s/2) - 2;
        const img = IMGS[h.caught.type.imgKey];
        drawImageCentered(img, h.x, ty, s);
      }
    }

    function drawHUD(now){
      ctx.fillStyle = "#fff";
      ctx.font = "13px system-ui";

      const h = STATE.hook;
      if (h.phase === "idle") ctx.fillText("タップ：好きな位置に糸を垂らす", 10, 18);
      else if (h.phase === "drop") ctx.fillText("落下中…当てろ！", 10, 18);
      else ctx.fillText("巻き上げ中！天敵に注意！", 10, 18);

      // small mode indicator
      if (STATE.extended){
        ctx.fillStyle = "rgba(255,255,255,.75)";
        ctx.font = "12px system-ui";
        ctx.fillText("延長中", 10, 36);
      }
      if (STATE.oni){
        ctx.fillStyle = "rgba(0,255,255,.85)";
        ctx.font = "12px system-ui";
        ctx.fillText("鬼モード", 60, 36);
      }

      // flash
      if (now < STATE.flashUntil && STATE.flashMsg){
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.fillRect(0, 44, W, 26);
        ctx.fillStyle = "#fff";
        ctx.font = "13px system-ui";
        ctx.fillText(STATE.flashMsg, 12, 62);
      }

      // freeze overlay hint
      if (STATE.freezeUntil && now < STATE.freezeUntil){
        ctx.fillStyle = "rgba(0,0,0,.35)";
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = "rgba(0,255,255,.9)";
        ctx.font = "18px system-ui";
        ctx.fillText("鬼モード突入", 110, 230);
      }

      // time up overlay (for safety; result UI will also show)
      if (remaining() <= 0){
        ctx.fillStyle = "rgba(0,0,0,.65)";
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = "#fff";
        ctx.font = "22px system-ui";
        ctx.fillText("TIME UP!", 120, 230);
      }
    }

    function render(now){
      drawBackground(now);
      drawTourist();
      drawSquid();
      drawDash(now);

      if (!STATE.hook.hasCatch) drawItems();
      drawHook();
      drawHUD(now);
    }

    // timer (1s)
    timerId = setInterval(() => {
      if (remaining() <= 0) return;
      STATE.elapsed++;

      // at 30s: decide extend
      if (STATE.elapsed === CFG.BASE_LIMIT){
        if (STATE.score >= CFG.EXT_SCORE){
          STATE.extended = true;
          STATE.limit = CFG.EXT_LIMIT;
          flashText(`延長解放！60秒へ（30秒時点 ${STATE.score}点）`, 1200);
        } else {
          // end at 30
          STATE.limit = CFG.BASE_LIMIT;
          flashText(`終了！延長条件：${CFG.EXT_SCORE}点（いま ${STATE.score}点）`, 1400);
        }
      }

      // oni at 45 (only if extended)
      if (STATE.extended && STATE.elapsed === CFG.ONI_AT){
        STATE.oni = true;
        STATE.oniReached = true;
        STATE.freezeUntil = nowMs() + CFG.ONI_FREEZE_MS;
        flashText("鬼モード突入！！", 1000);
      }

      // update HUD (DOM)
      timeEl.textContent  = String(remaining());
      scoreEl.textContent = String(STATE.score);
      comboEl.textContent = String(STATE.combo);
      missEl.textContent  = String(STATE.miss);

      // if time ended -> result
      if (remaining() <= 0){
        // give a tiny delay to let last frame draw
        setTimeout(() => {
          // show result UI
          showResult(STATE.score, STATE.extended, STATE.oniReached);
        }, 120);
      }
    }, 1000);

    // main loop
    let last = nowMs();

    function step(now){
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      // if time up => just render overlay; stop inputs still allowed but ignored by remaining()
      if (remaining() > 0){

        // apply freeze
        if (STATE.freezeUntil && now < STATE.freezeUntil){
          // during freeze: do not update physics, only render
          render(now);
          rafId = requestAnimationFrame(step);
          return;
        }

        // enemy speed mul on oni (no enemy count increase)
        const mul = STATE.oni ? CFG.ONI_SPEED_MUL : 1.0;

        // takoyaki alive motion
        for (const it of STATE.items){
          if (!it.alive) continue;

          if (now < it.pauseUntil){
            it.vx *= 0.90;
          } else {
            if (now >= it.nextMind){
              if (Math.random() < 0.10) it.pauseUntil = now + rand(260, 620);

              const flip = (Math.random() < 0.18) ? -1 : 1;
              const spd = CFG.ITEM_BASE_SPEED + rand(-18, 60);
              it.vxTarget = clamp(flip * (Math.random()<0.5?-1:1) * spd, -CFG.ITEM_MAX_SPEED, CFG.ITEM_MAX_SPEED);

              it.bobAmp = clamp(it.bobAmp + rand(-0.6, 0.9), 0.5, 3.4);
              it.bobSpd = clamp(it.bobSpd + rand(-1.2, 1.4), 2.0, 9.0);
              it.nextMind = now + rand(350, 1300);
            }

            const dv = it.vxTarget - it.vx;
            const stepV = clamp(dv, -CFG.ITEM_ACCEL*dt, CFG.ITEM_ACCEL*dt);
            it.vx += stepV;
            it.vx += rand(-6, 6) * dt;
            it.vx = clamp(it.vx, -CFG.ITEM_MAX_SPEED, CFG.ITEM_MAX_SPEED);
          }

          it.x += it.vx * dt;

          const half = it.spec.size.draw / 2;
          if (it.x - half < CFG.MARGIN_X){
            it.x = CFG.MARGIN_X + half;
            it.vx = Math.abs(it.vx) * (0.85 + Math.random()*0.25);
            it.vxTarget = Math.abs(it.vxTarget) * (0.8 + Math.random()*0.4);
            it.nextMind = Math.min(it.nextMind, now + rand(120, 420));
          }
          if (it.x + half > W - CFG.MARGIN_X){
            it.x = (W - CFG.MARGIN_X) - half;
            it.vx = -Math.abs(it.vx) * (0.85 + Math.random()*0.25);
            it.vxTarget = -Math.abs(it.vxTarget) * (0.8 + Math.random()*0.4);
            it.nextMind = Math.min(it.nextMind, now + rand(120, 420));
          }

          it.y = it.baseY + Math.sin((now/1000) * it.bobSpd + it.bobPhase) * it.bobAmp;
        }

        // tourist move (bounce + facing)
        const t = STATE.tourist;
        t.x += t.dir * t.speed * mul * dt;
        if (t.x < 0){ t.x = 0; t.dir *= -1; }
        if (t.x + t.w > W){ t.x = W - t.w; t.dir *= -1; }

        // squid move (baseX bounce + wobble)
        const s = STATE.squid;
        s.baseX += s.dir * s.speed * mul * dt;
        if (s.baseX < 0){ s.baseX = 0; s.dir *= -1; }
        if (s.baseX + s.w > W){ s.baseX = W - s.w; s.dir *= -1; }

        const sec = (now/1000) * (Math.PI*2) * s.freq + s.phase;
        s.x = s.baseX + Math.sin(sec) * s.ampX;
        s.y = s.baseY + Math.cos(sec * 0.85) * s.ampY;

        // dash spawn / move (concept streak)
        const d = STATE.dash;
        if (!d.active && now >= d.nextAt){
          spawnDash(now);
        }
        if (d.active){
          d.x += d.vx * dt;
          if (d.x + d.w < -40) despawnDash();
        }

        // hook
        const h = STATE.hook;

        // drop
        if (h.phase === "drop"){
          h.y += CFG.HOOK_DROP * dt;

          if (!h.hasCatch){
            for (const it of STATE.items){
              if (!it.alive) continue;
              const rr = it.spec.size.draw * 0.38;
              if (circleHit(h.x, h.y, h.hitR, it.x, it.y, rr)){
                h.hasCatch = true;
                h.phase = "reel";
                h.caught = it.spec;

                h.giantDropArmed = (it.spec.sizeKey === "giant");
                h.giantDropRolled = false;
                h.giantWillDrop = false;

                it.alive = false;
                flashText(`HIT!（${it.spec.size.label}/${it.spec.type.label}）`, 750);
                break;
              }
            }
          }

          if (h.y >= FLOOR_Y - 10){
            h.y = FLOOR_Y - 10;
            h.phase = "reel";
            if (!h.hasCatch){
              STATE.combo = 0;
              flashText("空振り…！", 600);
            }
          }
        }

        // reel
        if (h.phase === "reel"){
          h.y -= CFG.HOOK_REEL * dt;

          // giant drop
          if (h.hasCatch && h.caught && h.giantDropArmed){
            if (!h.giantDropRolled && h.y < GIANT_DROP_START_Y){
              h.giantDropRolled = true;
              h.giantWillDrop = (Math.random() < CFG.GIANT_DROP_CHANCE);
            }
            if (h.giantWillDrop && h.y < (GIANT_DROP_START_Y - 40)){
              // replenish an item
              const dead = STATE.items.find(v => !v.alive);
              if (dead) resetItem(dead);

              h.hasCatch = false;
              h.caught = null;
              onDropGiant();
            }
          }

          // collision with enemies while carrying
          if (h.hasCatch && h.caught){
            const fishSize = h.caught.size.draw;
            const fishR = fishSize * 0.38;
            const fishX = h.x;
            const fishY = h.y + (CFG.PICK_DRAW/2) + (fishSize/2) - 2;

            // tourist rect
            if (circleRectHit(fishX, fishY, fishR, t.x, t.y - t.h/2, t.w, t.h)){
              const dead = STATE.items.find(v => !v.alive);
              if (dead) resetItem(dead);
              h.hasCatch = false;
              h.caught = null;
              onStolen("tourist");
            }

            // squid rect
            if (h.hasCatch && circleRectHit(fishX, fishY, fishR, s.x, s.y - s.h/2, s.w, s.h)){
              const dead = STATE.items.find(v => !v.alive);
              if (dead) resetItem(dead);
              h.hasCatch = false;
              h.caught = null;
              onStolen("squid");
            }

            // dash rect
            if (h.hasCatch && d.active){
              if (circleRectHit(fishX, fishY, fishR, d.x, d.y - d.h/2, d.w, d.h)){
                const dead = STATE.items.find(v => !v.alive);
                if (dead) resetItem(dead);
                h.hasCatch = false;
                h.caught = null;
                onStolen("tourist");
                despawnDash();
              }
            }
          }

          // reached top
          if (h.y <= CFG.TOP_Y){
            h.y = CFG.TOP_Y;
            if (h.hasCatch && h.caught){
              // replenish
              const dead = STATE.items.find(v => !v.alive);
              if (dead) resetItem(dead);

              // apply score
              applyCatchScore(h.caught);

              // clear
              h.hasCatch = false;
              h.caught = null;
              setHookIdle();
            } else {
              setHookIdle();
            }
          }
        }
      }

      // update HUD DOM every frame (smooth)
      scoreEl.textContent = String(STATE.score);
      comboEl.textContent = String(STATE.combo);
      missEl.textContent  = String(STATE.miss);
      timeEl.textContent  = String(remaining());

      render(now);
      rafId = requestAnimationFrame(step);
    }

    // init
    setHookIdle();
    flashText("", 0);
    scoreEl.textContent = "0";
    comboEl.textContent = "0";
    missEl.textContent  = "0";
    timeEl.textContent  = String(remaining());

    rafId = requestAnimationFrame(step);
  }

  /* ==========================
     6) 起動/イベント
  ========================== */
  function openGame(){
    if (document.getElementById("tfModal")) return;

    document.body.insertAdjacentHTML("beforeend", buildModalHTML());

    // UI hooks
    document.getElementById("tfClose").addEventListener("click", closeGame);
    document.getElementById("tfExitBtn").addEventListener("click", closeGame);
    document.getElementById("tfCloseBtn2").addEventListener("click", closeGame);

    document.getElementById("tfAgainBtn").addEventListener("click", async () => {
      hideResult();
      await initAndShowRules();
    });

    document.getElementById("tfRetry").addEventListener("click", async () => {
      hideResult();
      await initAndShowRules();
    });

    // modal bg click close (optional)
    const modal = document.getElementById("tfModal");
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeGame();
    });

    initAndShowRules();
  }

  function closeGame(){
    stopGame();
    const m = document.getElementById("tfModal");
    if (m) m.remove();
  }

  window.openTakofishGame = openGame;

  async function initAndShowRules(){
    stopGame();
    hideResult();

    const cvs = document.getElementById("tfCanvas");
    const ctx = cvs.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // show rules
    const rules = document.getElementById("tfRules");
    rules.style.display = "flex";
    document.getElementById("tfUnlockTxt").textContent = String(CFG.EXT_SCORE);

    // loading screen
    ctx.fillStyle = "#081425";
    ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.fillStyle = "#fff";
    ctx.font = "16px system-ui";
    ctx.fillText("画像を読み込み中…", 100, 260);

    const { images, failed } = await loadAllImages();
    if (failed.length){
      ctx.fillStyle = "#081425";
      ctx.fillRect(0,0,CFG.W,CFG.H);
      ctx.fillStyle = "#fff";
      ctx.font = "14px system-ui";
      ctx.fillText("画像が読み込めないものがあります：", 20, 40);
      ctx.font = "11px system-ui";
      let y=70;
      for (const f of failed){
        ctx.fillText(`- ${f.key}: ${f.url}`, 20, y);
        y += 16;
        if (y > CFG.H - 30) break;
      }
      ctx.fillText("CDN_BASE / ファイル名を確認してください。", 20, CFG.H-16);
      return;
    }

    IMGS = images;

    // buttons
    const startBtn = document.getElementById("tfStartBtn");
    startBtn.onclick = () => {
      rules.style.display = "none";
      hideResult();
      startGame();
    };
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
