(() => {
  /* =========================================================
     ✅ TAKOFISH（元の釣りゲーム仕様そのまま / GitHub画像版）
     - 底に複数たこ焼き（生き物っぽく不規則移動）
     - タップ位置に糸を垂らす → 当たれば釣れる → 巻き上げ
     - 針先は pick.png
     - たこ焼き画像：ソース/いかさま/金/虹/生焼け（出現率 55/20/10/5/10）
     - サイズ：極小/普通/巨大（小さいほど高得点）
     - 巨大は運が悪いと途中で落ちる
     - 天敵：上（小）/下（大・遅い） 常駐で泳ぐ
     - 10〜15秒に1回：超高速天敵が右→左に横切って消える
     - 入口：window.openTakofishGame()
     ========================================================= */

  /* ===== GitHub(jsDelivr)画像 ===== */
  const CDN_BASE = "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/";
  const V = "1"; // 画像更新時は 2,3... に（キャッシュ対策）

  const IMG_URLS = {
    pick:    `${CDN_BASE}pick.png?v=${V}`,
    sauce:   `${CDN_BASE}tako_sauce.png?v=${V}`,
    ika:     `${CDN_BASE}tako_ika.png?v=${V}`,
    gold:    `${CDN_BASE}tako_gold.png?v=${V}`,
    rainbow: `${CDN_BASE}tako_rainbow.png?v=${V}`,
    raw:     `${CDN_BASE}tako_raw.png?v=${V}`,
  };

  /* ===== モーダルHTML ===== */
  function buildModalHTML(){
    return `
<div class="takofish-modal" id="tfModal" style="position:fixed;inset:0;display:block;z-index:99999;background:rgba(0,0,0,.78)">
  <div class="takofish-modal__inner" role="dialog" aria-label="たこ焼き釣り"
       style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
              width:min(420px,94vw);background:#111;border:3px solid #fff;border-radius:10px;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#000;color:#fff;">
      <div style="font-weight:700;">たこ焼き釣り</div>
      <button id="tfClose" type="button" aria-label="閉じる"
              style="font-size:18px;line-height:1;border:2px solid #fff;background:#000;color:#fff;border-radius:8px;padding:2px 10px;cursor:pointer;">×</button>
    </div>

    <div style="padding:8px 10px;color:#fff;font-size:12px;background:#111;border-top:1px solid rgba(255,255,255,.15);">
      小さいほど高得点／レアほど高得点／生焼けはマイナス／巨大は途中落下あり
    </div>

    <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 10px;background:#111;border-top:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;">
      <button id="tfRetry" type="button"
              style="border:2px solid #fff;background:#000;color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">もう一回</button>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
        <span>スコア：<b id="tfScore">0</b></span>
        <span>残り：<b id="tfTime">30</b>s</span>
        <span>連続：<b id="tfCombo">0</b></span>
        <span>失敗：<b id="tfMiss">0</b></span>
      </div>
    </div>

    <div style="background:#000;border-top:1px solid rgba(255,255,255,.15);">
      <canvas id="tfCanvas" width="360" height="520" style="display:block;width:100%;height:auto;image-rendering:pixelated;"></canvas>
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
    document.getElementById("tfRetry").addEventListener("click", () => startGame().catch(console.error));

    startGame().catch(console.error);
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
      try{
        images[k] = await loadImage(IMG_URLS[k]);
      }catch(e){
        failed.push({ key:k, url:String(e.message || e) });
      }
    }
    return { images, failed };
  }

  /* ===== ゲーム状態 ===== */
  let rafId = null;
  let timerId = null;
  let onPointer = null;

  let flashMsg = "";
  let flashUntil = 0;

  async function startGame(){
    stopGame();

    const cvs = document.getElementById("tfCanvas");
    const ctx = cvs.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const scoreEl = document.getElementById("tfScore");
    const timeEl  = document.getElementById("tfTime");
    const comboEl = document.getElementById("tfCombo");
    const missEl  = document.getElementById("tfMiss");

    const W = cvs.width;
    const H = cvs.height;

    /* ==========================
       ✅ ここだけ調整ポイント
    ========================== */
    const TIME_LIMIT = 30;

    // たこ焼き数
    const ITEM_COUNT = 7;

    // 生き物っぽい挙動
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

    // 天敵（常駐）：上は小さめ、下は遅い
    const ENEMY_CENTER_Y = Math.floor(H * 0.45);
    const ENEMY_GAP = 170;

    const TOURIST_Y = ENEMY_CENTER_Y - Math.floor(ENEMY_GAP * 0.55);
    const BLACK_Y   = ENEMY_CENTER_Y + Math.floor(ENEMY_GAP * 0.55);

    const TOURIST_SPEED = 90; // 上
    const BLACK_SPEED   = 20; // 下（超遅）

    const TOURIST_W = 28;
    const TOURIST_H = 11;

    const BLACK_W = 50;
    const BLACK_H = 20;

    // 超高速天敵（10〜15秒）
    const DASH_MIN_SEC = 10;
    const DASH_MAX_SEC = 15;
    const DASH_SPEED   = 900;
    const DASH_W       = 34;
    const DASH_H       = 14;
    const DASH_Y       = Math.floor((TOURIST_Y + BLACK_Y) * 0.5) - 12;

    // 出現率（ユーザー指定）
    const TYPE_WEIGHTS = [
      { key:"sauce",   w:55 }, // ノーマル
      { key:"ika",     w:20 }, // ノーマルレア
      { key:"gold",    w:10 }, // レア
      { key:"rainbow", w: 5 }, // プレミア
      { key:"raw",     w:10 }, // ハズレ（マイナス）
    ];

    // サイズ出現率（お好み）
    const SIZE_WEIGHTS = [
      { key:"normal", w:62 },
      { key:"tiny",   w:28 },
      { key:"giant",  w:10 },
    ];
    /* ========================== */

    const FLOOR_Y = Math.floor(H * 0.86);
    const TOP_Y   = 18;
    const SAFE_MARGIN_X = 10;

    // スコア
    let t = TIME_LIMIT;
    let score = 0;
    let combo = 0;
    let miss = 0;

    // util
    const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
    const rand  = (a,b)=>a+Math.random()*(b-a);

    function flashText(msg, ms){
      flashMsg = msg;
      flashUntil = performance.now() + ms;
    }

    function circleHit(ax, ay, ar, bx, by, br){
      const dx = ax - bx, dy = ay - by;
      return (dx*dx + dy*dy) <= (ar+br)*(ar+br);
    }

    function circleRectHit(cx, cy, cr, rx, ry, rw, rh){
      const nx = clamp(cx, rx, rx + rw);
      const ny = clamp(cy, ry, ry + rh);
      const dx = cx - nx;
      const dy = cy - ny;
      return (dx*dx + dy*dy) <= cr*cr;
    }

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

    /* ===== 画像ロード ===== */
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#fff";
    ctx.font = "16px system-ui";
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
      ctx.fillText("CDN_BASE / ファイル名 を確認してください。", 20, H-16);
      return;
    }

    /* ===== サイズ/種類/ポイント ===== */
    const SIZE_TABLE = {
      tiny:   { key:"tiny",   label:"極小",  draw: TAKO_TINY,   base: 120 },
      normal: { key:"normal", label:"普通",  draw: TAKO_NORMAL, base: 70  },
      giant:  { key:"giant",  label:"巨大",  draw: TAKO_GIANT,  base: 40  },
    };

    const TYPE_TABLE = {
      sauce:   { key:"sauce",   label:"ソース",     mult: 1.00, kind:"plus",  imgKey:"sauce" },
      ika:     { key:"ika",     label:"いかさま",   mult: 1.40, kind:"plus",  imgKey:"ika" },
      gold:    { key:"gold",    label:"ゴールド",   mult: 2.80, kind:"plus",  imgKey:"gold" },
      rainbow: { key:"rainbow", label:"レインボー", mult: 5.50, kind:"plus",  imgKey:"rainbow" },
      raw:     { key:"raw",     label:"生焼け",     mult: 0.00, kind:"minus", imgKey:"raw", penalty: -120 },
    };

    function buildTakoyakiSpec(){
      const sizeKey = pickByWeight(SIZE_WEIGHTS);
      const typeKey = pickByWeight(TYPE_WEIGHTS);

      const size = SIZE_TABLE[sizeKey];
      const type = TYPE_TABLE[typeKey];

      let points = 0;
      if (type.kind === "minus") points = type.penalty;
      else points = Math.round(size.base * type.mult);

      return { sizeKey, size, type, points };
    }

    /* ===== 底のたこ焼き（不規則移動） ===== */
    const items = [];
    for (let i=0; i<ITEM_COUNT; i++){
      const spec = buildTakoyakiSpec();
      const baseY = (FLOOR_Y - 14) + rand(-2, 2);

      items.push({
        x: rand(W*0.15, W*0.85),
        baseY,
        y: baseY,
        alive: true,
        spec,

        vx: (Math.random()<0.5?-1:1) * (ITEM_BASE_SPEED + rand(0, 22)),
        vxTarget: (Math.random()<0.5?-1:1) * (ITEM_BASE_SPEED + rand(0, 50)),
        bobAmp: rand(0.6, 2.4),
        bobSpd: rand(3.0, 7.8),
        bobPhase: rand(0, Math.PI*2),
        nextMind: performance.now() + rand(450, 1100),
        pauseUntil: 0,
      });
    }

    function resetItem(it){
      it.spec = buildTakoyakiSpec();
      const baseY = (FLOOR_Y - 14) + rand(-2, 2);

      it.x = rand(W*0.15, W*0.85);
      it.baseY = baseY;
      it.y = baseY;
      it.alive = true;

      it.vx = (Math.random()<0.5?-1:1) * (ITEM_BASE_SPEED + rand(0, 22));
      it.vxTarget = (Math.random()<0.5?-1:1) * (ITEM_BASE_SPEED + rand(0, 50));
      it.bobAmp = rand(0.6, 2.4);
      it.bobSpd = rand(3.0, 7.8);
      it.bobPhase = rand(0, Math.PI*2);
      it.nextMind = performance.now() + rand(450, 1100);
      it.pauseUntil = 0;
    }

    /* ===== フック ===== */
    const hook = {
      x: W * 0.5,
      y: TOP_Y,
      hitR: HOOK_HIT_R,
      phase: "idle",     // idle | drop | reel
      hasCatch: false,
      caught: null,      // spec
      giantDropArmed: false,
      giantDropRolled: false,
      giantWillDrop: false,
    };

    function setHookIdle(){
      hook.phase = "idle";
      hook.y = TOP_Y;
      hook.hasCatch = false;
      hook.caught = null;
      hook.giantDropArmed = false;
      hook.giantDropRolled = false;
      hook.giantWillDrop = false;
    }

    /* ===== 天敵（常駐2体） ===== */
    const enemies = [
      { key:"tourist", x:0, y:TOURIST_Y, w:TOURIST_W, h:TOURIST_H, speed:TOURIST_SPEED, dir: 1 },
      { key:"black",   x:W-BLACK_W, y:BLACK_Y, w:BLACK_W, h:BLACK_H, speed:BLACK_SPEED, dir:-1 },
    ];
    const enemyVX = (en) => en.dir * en.speed;

    /* ===== 超高速天敵 ===== */
    const dash = {
      active: false,
      x: W + 40,
      y: DASH_Y,
      w: DASH_W,
      h: DASH_H,
      vx: -DASH_SPEED,
      nextAt: performance.now() + (DASH_MIN_SEC*1000 + Math.random()*(DASH_MAX_SEC-DASH_MIN_SEC)*1000),
    };

    function spawnDash(now){
      dash.active = true;
      dash.x = W + dash.w + 6;
      dash.vx = -DASH_SPEED;
      dash.nextAt = now + (DASH_MIN_SEC*1000 + Math.random()*(DASH_MAX_SEC-DASH_MIN_SEC)*1000);
      flashText("⚠ 超高速天敵！", 600);
    }
    function despawnDash(){
      dash.active = false;
      dash.x = W + dash.w + 6;
    }

    /* ===== スコア処理 ===== */
    function applyCatchScore(spec){
      if (spec.type.kind === "minus"){
        score += spec.points;
        combo = 0;
        miss++;

        scoreEl.textContent = String(score);
        comboEl.textContent = String(combo);
        missEl.textContent  = String(miss);

        flashText(`ハズレ！${spec.type.label} ${spec.points}`, 1100);
        return;
      }

      combo++;
      const comboBonus = Math.min(120, combo * 6);
      score += spec.points + comboBonus;

      scoreEl.textContent = String(score);
      comboEl.textContent = String(combo);

      flashText(`GET! +${spec.points}（${spec.size.label}/${spec.type.label}）`, 950);
    }

    function onStolen(byKey){
      combo = 0;
      miss++;

      if (byKey === "black"){
        score -= 40;
        scoreEl.textContent = String(score);
        flashText("裏市場タコ民に回収された… -40", 1200);
      } else {
        flashText("観光客に横取りされた！", 900);
      }

      comboEl.textContent = String(combo);
      missEl.textContent  = String(miss);
      setHookIdle();
    }

    function onDropGiant(){
      combo = 0;
      miss++;
      comboEl.textContent = String(combo);
      missEl.textContent  = String(miss);
      flashText("巨大たこ焼き、落ちた！！", 1100);
      setHookIdle();
    }

    /* ===== 入力：タップ位置に落下 ===== */
    function pointerToCanvasX(e){
      const rect = cvs.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      return clamp(x, SAFE_MARGIN_X, W - SAFE_MARGIN_X);
    }

    function startDropAt(x){
      if (t <= 0) return;
      if (hook.phase !== "idle") return;

      hook.x = clamp(x, SAFE_MARGIN_X, W - SAFE_MARGIN_X);
      hook.phase = "drop";
      hook.hasCatch = false;
      hook.caught = null;
      hook.giantDropArmed = false;
      hook.giantDropRolled = false;
      hook.giantWillDrop = false;
    }

    /* ===== 描画ヘルパー ===== */
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
    }

    function drawEnemies(){
      // 上（観光客）小
      const a = enemies[0];
      ctx.fillStyle = "#e6e6e6";
      ctx.fillRect(Math.round(a.x), Math.round(a.y - a.h/2), a.w, a.h);
      ctx.fillStyle = "#222";
      ctx.fillRect(Math.round(a.x + a.w - 7), Math.round(a.y - a.h/2 + Math.max(1, Math.floor(a.h/2) - 2)), 6, 4);

      // 下（裏市場）大
      const b = enemies[1];
      ctx.fillStyle = "#111";
      ctx.fillRect(Math.round(b.x), Math.round(b.y - b.h/2), b.w, b.h);
      ctx.fillStyle = "#fff";
      ctx.fillRect(Math.round(b.x + 10), Math.round(b.y - b.h/2 + 7), 4, 4);
      ctx.fillRect(Math.round(b.x + 24), Math.round(b.y - b.h/2 + 7), 4, 4);
    }

    function drawDash(){
      if (!dash.active) return;
      const ex = Math.round(dash.x);
      const ey = Math.round(dash.y - dash.h/2);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(ex, ey, dash.w, dash.h);
      ctx.fillStyle = "#111";
      ctx.fillRect(ex + dash.w - 8, ey + 4, 7, 6);
    }

    function drawItems(){
      for (const it of items){
        if (!it.alive) continue;
        const img = images[it.spec.type.imgKey];
        drawImageCentered(img, it.x, it.y, it.spec.size.draw);
      }
    }

    function drawHook(){
      // 糸
      ctx.strokeStyle = "rgba(255,255,255,.25)";
      ctx.beginPath();
      ctx.moveTo(hook.x, TOP_Y);
      ctx.lineTo(hook.x, hook.y);
      ctx.stroke();

      // 針先（ピック）
      drawImageCentered(images.pick, hook.x, hook.y, PICK_DRAW);

      // 釣れてるたこ焼き
      if (hook.hasCatch && hook.caught){
        const s = hook.caught.size.draw;
        const ty = hook.y + (PICK_DRAW/2) + (s/2) - 2;
        const img = images[hook.caught.type.imgKey];
        drawImageCentered(img, hook.x, ty, s);
      }
    }

    function drawHUD(now){
      ctx.fillStyle = "#fff";
      ctx.font = "13px system-ui";

      if (hook.phase === "idle") ctx.fillText("タップ：好きな位置に糸を垂らす", 10, 18);
      else if (hook.phase === "drop") ctx.fillText("落下中…当てろ！", 10, 18);
      else ctx.fillText("巻き上げ中！天敵＆巨大落下に注意！", 10, 18);

      if (now < flashUntil && flashMsg){
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.fillRect(0, 28, W, 28);
        ctx.fillStyle = "#fff";
        ctx.font = "14px system-ui";
        ctx.fillText(flashMsg, 12, 48);
      }

      if (t <= 0){
        ctx.fillStyle = "rgba(0,0,0,.65)";
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = "#fff";
        ctx.font = "22px system-ui";
        ctx.fillText("TIME UP!", 120, 230);
      }
    }

    function render(now){
      drawBackground();
      drawEnemies();
      drawDash();

      if (!hook.hasCatch) drawItems();
      drawHook();
      drawHUD(now);
    }

    /* ===== ループ ===== */
    let last = performance.now();

    function step(now){
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (t > 0){
        // たこ焼き：生き物っぽく不規則
        for (const it of items){
          if (!it.alive) continue;

          if (now < it.pauseUntil){
            it.vx *= 0.90;
          } else {
            if (now >= it.nextMind){
              if (Math.random() < 0.10){
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

          const half = it.spec.size.draw / 2;
          if (it.x - half < SAFE_MARGIN_X){
            it.x = SAFE_MARGIN_X + half;
            it.vx = Math.abs(it.vx) * (0.85 + Math.random()*0.25);
            it.vxTarget = Math.abs(it.vxTarget) * (0.8 + Math.random()*0.4);
            it.nextMind = Math.min(it.nextMind, now + rand(120, 420));
          }
          if (it.x + half > W - SAFE_MARGIN_X){
            it.x = (W - SAFE_MARGIN_X) - half;
            it.vx = -Math.abs(it.vx) * (0.85 + Math.random()*0.25);
            it.vxTarget = -Math.abs(it.vxTarget) * (0.8 + Math.random()*0.4);
            it.nextMind = Math.min(it.nextMind, now + rand(120, 420));
          }

          it.y = it.baseY + Math.sin((now/1000) * it.bobSpd + it.bobPhase) * it.bobAmp;
        }

        // 常駐天敵
        for (const en of enemies){
          en.x += enemyVX(en) * dt;
          if (en.x < 0){ en.x = 0; en.dir *= -1; }
          if (en.x + en.w > W){ en.x = W - en.w; en.dir *= -1; }
        }

        // 超高速天敵：時間で出現
        if (!dash.active && now >= dash.nextAt){
          spawnDash(now);
        }
        if (dash.active){
          dash.x += dash.vx * dt;
          if (dash.x + dash.w < -10) despawnDash();
        }

        // フック：落下
        if (hook.phase === "drop"){
          hook.y += HOOK_DROP_SPEED * dt;

          // ヒット判定
          if (!hook.hasCatch){
            for (const it of items){
              if (!it.alive) continue;

              const s = it.spec.size.draw;
              const rr = s * 0.38;
              if (circleHit(hook.x, hook.y, hook.hitR, it.x, it.y, rr)){
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

          // 底到達（空振り）
          if (hook.y >= FLOOR_Y - 10){
            hook.y = FLOOR_Y - 10;
            hook.phase = "reel";

            if (!hook.hasCatch){
              combo = 0;
              comboEl.textContent = String(combo);
              flashText("空振り…！", 650);
            }
          }
        }

        // フック：巻き上げ
        if (hook.phase === "reel"){
          hook.y -= HOOK_REEL_SPEED * dt;

          // 巨大：途中落下
          if (hook.hasCatch && hook.caught && hook.giantDropArmed){
            if (!hook.giantDropRolled && hook.y < GIANT_DROP_START_Y){
              hook.giantDropRolled = true;
              hook.giantWillDrop = (Math.random() < GIANT_DROP_CHANCE);
            }
            if (hook.giantWillDrop && hook.y < (GIANT_DROP_START_Y - 40)){
              const dead = items.find(v => !v.alive);
              if (dead) resetItem(dead);

              hook.hasCatch = false;
              hook.caught = null;
              onDropGiant();
            }
          }

          // 天敵衝突（釣れてる時のみ）
          if (hook.hasCatch && hook.caught){
            const fishSize = hook.caught.size.draw;
            const fishR = fishSize * 0.38;
            const fishX = hook.x;
            const fishY = hook.y + (PICK_DRAW/2) + (fishSize/2) - 2;

            // 常駐天敵
            for (const en of enemies){
              const hit = circleRectHit(
                fishX, fishY, fishR,
                en.x, en.y - en.h/2, en.w, en.h
              );
              if (hit){
                const dead = items.find(v => !v.alive);
                if (dead) resetItem(dead);

                hook.hasCatch = false;
                hook.caught = null;
                onStolen(en.key);
                break;
              }
            }

            // 超高速天敵
            if (hook.hasCatch && dash.active){
              const hitDash = circleRectHit(
                fishX, fishY, fishR,
                dash.x, dash.y - dash.h/2, dash.w, dash.h
              );
              if (hitDash){
                const dead = items.find(v => !v.alive);
                if (dead) resetItem(dead);

                hook.hasCatch = false;
                hook.caught = null;
                onStolen("tourist");
                despawnDash();
              }
            }
          }

          // 上まで到達
          if (hook.y <= TOP_Y){
            hook.y = TOP_Y;

            if (hook.hasCatch && hook.caught){
              const dead = items.find(v => !v.alive);
              if (dead) resetItem(dead);

              applyCatchScore(hook.caught);

              hook.hasCatch = false;
              hook.caught = null;
              setHookIdle();
            } else {
              setHookIdle();
            }
          }
        }
      }

      // HUD更新（DOM）
      timeEl.textContent  = String(Math.max(0, t));
      scoreEl.textContent = String(score);
      comboEl.textContent = String(combo);
      missEl.textContent  = String(miss);

      render(now);
      rafId = requestAnimationFrame(step);
    }

    // 入力
    onPointer = (e) => {
      e.preventDefault();
      startDropAt(pointerToCanvasX(e));
    };
    cvs.addEventListener("pointerdown", onPointer);

    // タイマー
    timerId = setInterval(() => {
      t--;
      if (t <= 0) t = 0;
    }, 1000);

    // 初期化
    setHookIdle();
    flashMsg = "";
    flashUntil = 0;

    last = performance.now();
    rafId = requestAnimationFrame(step);
  }

  function stopGame(){
    if (timerId) clearInterval(timerId);
    timerId = null;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    const cvs = document.getElementById("tfCanvas");
    if (cvs && onPointer){
      cvs.removeEventListener("pointerdown", onPointer);
    }
    onPointer = null;
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
