/* =========================================================
   takofish.js（完成形・まるごと）
   - Canvasゲーム
   - たこ焼き複数漂う
   - 糸を垂らして釣る（クリック/タップで投下→自動巻き上げ）
   - 天敵：観光客（左右往復）※そのまま
   - 天敵：イカ（ゆらゆら）
   - 超高速天敵：削除
   - 1分（60秒）
   - 開始前にルールページ表示 → Startで開始
   - 画像：GitHub + jsDelivr
========================================================= */

(() => {
  /* =========================
     画像URL（あなたのassets/takofish）
  ========================= */
  const IMG = {
    pick: "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/pick.png?v=1",
    tako: {
      raw:     "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/tako_raw.png?v=1",
      sauce:   "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/tako_sauce.png?v=1",
      gold:    "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/tako_gold.png?v=1",
      rainbow: "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/tako_rainbow.png?v=1",
      ika:     "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/tako_ika.png?v=1"
    },
    enemy: {
      ika:      "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/ika.png?v=1",
      touristL: "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/tourist_left.png?v=1",
      touristR: "https://cdn.jsdelivr.net/gh/takoyaki-trc/takoyaki-gate@main/assets/takofish/tourist_right.png?v=1",
    }
  };

  /* =========================
     スコア（ルールに表示）
  ========================= */
  const SCORE = {
    raw: 5,
    sauce: 7,
    gold: 15,
    rainbow: 25,
    ika: 12,      // いかさま焼き（レア枠）
    hitTourist: -10,
    hitIka: -15
  };

  /* =========================
     サイズ
  ========================= */
  const SIZE = {
    tako: 48,
    pick: 16,
    tourist: 64,
    ika: 72
  };

  /* =========================
     ゲーム設定
  ========================= */
  const GAME = {
    durationSec: 60,
    takoCount: 10,          // 同時に漂う数
    maxLine: 340,           // 糸の最大長
    lineSpeed: 7.2,         // 糸の伸縮速度
    reelSpeed: 7.6,
    bg: "#0b1530",
    water: "rgba(60,120,200,0.18)",
    stunMs: 650
  };

  /* =========================
     ユーティリティ
  ========================= */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand  = (a,b) => a + Math.random()*(b-a);

  function loadImage(src){
    return new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => resolve(null);
      im.src = src;
    });
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh){
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
  }

  /* =========================
     入口：外から呼べるように
  ========================= */
  window.openTakofishGame = async function openTakofishGame(){
    // 既存があれば消す
    const old = document.getElementById("tfOverlay");
    if (old) old.remove();

    // オーバーレイ作成
    const overlay = document.createElement("div");
    overlay.id = "tfOverlay";
    overlay.innerHTML = buildHTML();
    document.body.appendChild(overlay);

    // 参照
    const rulePanel = overlay.querySelector("#tfRulePanel");
    const btnStart  = overlay.querySelector("#tfStart");
    const btnClose1 = overlay.querySelector("#tfCloseRule");
    const btnClose2 = overlay.querySelector("#tfCloseGame");

    const gamePanel = overlay.querySelector("#tfGamePanel");
    const cvs = overlay.querySelector("#tfCanvas");
    const ctx = cvs.getContext("2d");

    const elScore = overlay.querySelector("#tfScore");
    const elTime  = overlay.querySelector("#tfTime");
    const elMsg   = overlay.querySelector("#tfMsg");

    // 閉じる
    const closeAll = () => overlay.remove();
    btnClose1.addEventListener("click", closeAll);
    btnClose2.addEventListener("click", closeAll);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeAll();
    });

    // ルール→開始
    btnStart.addEventListener("click", async () => {
      rulePanel.style.display = "none";
      gamePanel.style.display = "block";

      // canvasリサイズ
      const resize = () => {
        const wrap = overlay.querySelector("#tfCanvasWrap");
        const w = Math.floor(wrap.clientWidth);
        const h = Math.floor(wrap.clientHeight);
        cvs.width = w * devicePixelRatio;
        cvs.height = h * devicePixelRatio;
        cvs.style.width = w+"px";
        cvs.style.height = h+"px";
        ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
      };
      resize();
      window.addEventListener("resize", resize, { passive:true });

      // 画像ロード
      elMsg.textContent = "画像読み込み中…";
      const IM = {
        pick: await loadImage(IMG.pick),
        tako: {
          raw: await loadImage(IMG.tako.raw),
          sauce: await loadImage(IMG.tako.sauce),
          gold: await loadImage(IMG.tako.gold),
          rainbow: await loadImage(IMG.tako.rainbow),
          ika: await loadImage(IMG.tako.ika)
        },
        enemy: {
          ika: await loadImage(IMG.enemy.ika),
          touristL: await loadImage(IMG.enemy.touristL),
          touristR: await loadImage(IMG.enemy.touristR),
        }
      };
      elMsg.textContent = "";

      // ゲーム開始
      startGame({ overlay, cvs, ctx, IM, elScore, elTime, elMsg, resize });
    });

    // 初期：ルール表示
    rulePanel.style.display = "block";
    gamePanel.style.display = "none";
  };

  /* =========================
     HTML（ルール→ゲーム）
  ========================= */
  function buildHTML(){
    // ルールのスコア表（見やすく固定）
    return `
<style>
#tfOverlay{
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.72);
  z-index: 999999;
  display:flex; align-items:center; justify-content:center;
  padding: 14px;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}
.tfPanel{
  width: min(820px, 96vw);
  max-height: min(90vh, 780px);
  background: #0a0a0a;
  border: 3px solid #fff;
  box-shadow: 0 10px 40px rgba(0,0,0,.45);
  border-radius: 10px;
  overflow:hidden;
}
.tfHead{
  display:flex; align-items:center; justify-content:space-between;
  padding: 10px 12px;
  background:#000;
  border-bottom: 2px solid #fff;
  color:#fff;
}
.tfTitle{ font-size: 14px; letter-spacing: .08em; }
.tfClose{
  width: 34px; height: 34px;
  border: 2px solid #fff;
  background:#000; color:#fff;
  border-radius: 8px;
  font-size: 18px; cursor:pointer;
}
.tfBody{ padding: 12px; color:#fff; }
.tfPaper{
  background: #f2ead6;
  color: #1a1a1a;
  border: 3px solid #2a2a2a;
  border-radius: 12px;
  padding: 14px 14px;
}
.tfPaper h3{ margin: 0 0 10px; font-size: 16px; }
.tfPaper p{ margin: 8px 0; line-height: 1.5; font-size: 14px; }
.tfGrid{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}
.tfBox{
  background:#fff;
  border: 2px solid #2a2a2a;
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
}
.tfBox b{ display:block; margin-bottom: 6px; }
.tfTable{
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 14px;
}
.tfTable td{
  border: 1px solid #2a2a2a;
  padding: 6px 8px;
  background:#fff;
}
.tfBtnRow{ margin-top: 12px; display:flex; gap:10px; }
.tfBtn{
  border: 3px solid #000;
  background:#ffeb3b;
  color:#000;
  font-weight: 900;
  border-radius: 12px;
  padding: 10px 14px;
  cursor:pointer;
}
.tfBtnSub{
  border: 2px solid #2a2a2a;
  background:#fff;
  border-radius: 12px;
  padding: 10px 14px;
  cursor:pointer;
}
#tfGamePanel{ display:none; }
#tfCanvasWrap{
  width: 100%;
  height: min(64vh, 520px);
  background: #071024;
  border: 2px solid #fff;
  border-radius: 12px;
  overflow:hidden;
  position: relative;
}
#tfHud{
  display:flex; gap: 10px; align-items:center; justify-content:space-between;
  margin-bottom: 10px;
  font-size: 14px;
}
#tfMsg{ opacity: .9; font-size: 13px; }
.tfMono{ font-variant-numeric: tabular-nums; }
</style>

<div class="tfPanel">
  <!-- ルール -->
  <div id="tfRulePanel">
    <div class="tfHead">
      <div class="tfTitle">🎣 たこ焼き釣り（ルール説明）</div>
      <button class="tfClose" id="tfCloseRule" type="button" aria-label="閉じる">×</button>
    </div>
    <div class="tfBody">
      <div class="tfPaper">
        <h3>遊び方（1分勝負）</h3>
        <p>画面をタップ / クリックすると、その位置から<strong>糸を垂らして釣り</strong>をします。<br>
        たこ焼きに当たると自動で巻き上げて獲得！</p>

        <div class="tfGrid">
          <div class="tfBox">
            <b>操作</b>
            ・マウス/指：左右移動（狙う位置）<br>
            ・タップ/クリック：糸を投下（自動で戻る）<br>
            ・1回投げたら戻るまで待つ（連打不可）
          </div>
          <div class="tfBox">
            <b>天敵</b>
            ・上：観光客（左右移動）<br>
            ・下：イカ（ゆらゆら漂う）<br>
            天敵に当たるとポイントが減ります。
          </div>
        </div>

        <p style="margin-top:10px;"><strong>ポイント表</strong></p>
        <table class="tfTable" aria-label="ポイント表">
          <tr><td>すっぴん（raw）</td><td>+${SCORE.raw}</td></tr>
          <tr><td>ソース（sauce）</td><td>+${SCORE.sauce}</td></tr>
          <tr><td>ゴールド（gold）</td><td>+${SCORE.gold}</td></tr>
          <tr><td>レインボー（rainbow）</td><td>+${SCORE.rainbow}</td></tr>
          <tr><td>いかさま焼き（tako_ika）</td><td>+${SCORE.ika}</td></tr>
          <tr><td>観光客にヒット</td><td>${SCORE.hitTourist}</td></tr>
          <tr><td>イカにヒット</td><td>${SCORE.hitIka}</td></tr>
        </table>

        <p style="margin-top:10px;">
          <strong>勝利条件：</strong> 60秒でできるだけ高得点を目指す！<br>
          <strong>コツ：</strong> レア（ゴールド/レインボー/いかさま焼き）を狙うと一気に伸びます。
        </p>

        <div class="tfBtnRow">
          <button class="tfBtn" id="tfStart" type="button">START（60秒）</button>
          <button class="tfBtnSub" id="tfCloseRule2" type="button" onclick="document.getElementById('tfCloseRule').click()">閉じる</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ゲーム -->
  <div id="tfGamePanel">
    <div class="tfHead">
      <div class="tfTitle">🎣 たこ焼き釣り（1分）</div>
      <button class="tfClose" id="tfCloseGame" type="button" aria-label="閉じる">×</button>
    </div>

    <div class="tfBody">
      <div id="tfHud">
        <div>Score: <span id="tfScore" class="tfMono">0</span></div>
        <div>Time: <span id="tfTime" class="tfMono">60</span>s</div>
        <div id="tfMsg"></div>
      </div>
      <div id="tfCanvasWrap">
        <canvas id="tfCanvas"></canvas>
      </div>
      <div style="margin-top:10px; font-size:13px; opacity:.9;">
        操作：画面をタップ/クリックで糸を投下。天敵に当たると減点。
      </div>
    </div>
  </div>
</div>
`;
  }

  /* =========================
     ゲーム本体
  ========================= */
  function startGame({ overlay, cvs, ctx, IM, elScore, elTime, elMsg, resize }){
    const wrap = overlay.querySelector("#tfCanvasWrap");

    // 入力（狙い位置）
    let targetX = 0.5;
    const pointer = (e) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      targetX = clamp(x / r.width, 0.05, 0.95);
    };
    wrap.addEventListener("mousemove", pointer, { passive:true });
    wrap.addEventListener("touchmove", pointer, { passive:true });

    // 状態
    let score = 0;
    let timeLeft = GAME.durationSec;
    let running = true;

    // 糸
    const line = {
      x: 0, y0: 18,
      len: 0,
      state: "idle", // idle | down | up
      hasCatch: null,
      stunUntil: 0
    };

    // たこ焼き（漂う）
    const takoTypes = [
      { key:"raw", img: IM.tako.raw, pts: SCORE.raw, w: SIZE.tako, h: SIZE.tako, weight: 40 },
      { key:"sauce", img: IM.tako.sauce, pts: SCORE.sauce, w: SIZE.tako, h: SIZE.tako, weight: 35 },
      { key:"gold", img: IM.tako.gold, pts: SCORE.gold, w: SIZE.tako, h: SIZE.tako, weight: 14 },
      { key:"rainbow", img: IM.tako.rainbow, pts: SCORE.rainbow, w: SIZE.tako, h: SIZE.tako, weight: 6 },
      { key:"ika", img: IM.tako.ika, pts: SCORE.ika, w: SIZE.tako, h: SIZE.tako, weight: 5 }
    ];
    const pickWeighted = () => {
      const sum = takoTypes.reduce((s,t)=>s+t.weight,0);
      let r = Math.random()*sum;
      for (const t of takoTypes){ r -= t.weight; if (r<=0) return t; }
      return takoTypes[0];
    };

    const takos = [];
    function spawnTako(w, h){
      const t = pickWeighted();
      const o = {
        type: t,
        x: rand(20, w-20),
        y: rand(h*0.35, h*0.92),
        vx: rand(-0.55, 0.55),
        vy: rand(-0.18, 0.18),
        wob: rand(0, 9999)
      };
      takos.push(o);
    }

    // 天敵：観光客（上で左右往復、向き切り替え）
    const tourist = {
      y: 78,
      x: 100,
      vx: 1.25,
      dir: 1 // 1=right, -1=left
    };

    // 天敵：イカ（下：ゆらゆら）
    const ika = {
      baseX: 0.5,
      baseY: 0.86,
      t: 0
    };

    // クリック/タップで投下（戻るまで不可）
    const cast = (e) => {
      if (!running) return;
      const now = performance.now();
      if (now < line.stunUntil) return;
      if (line.state !== "idle") return;

      pointer(e);
      line.x = targetX;
      line.len = 0;
      line.hasCatch = null;
      line.state = "down";
    };
    wrap.addEventListener("click", cast);
    wrap.addEventListener("touchstart", (e)=>{ cast(e); }, { passive:true });

    // タイマー
    const tickTimer = setInterval(() => {
      if (!running) return;
      timeLeft -= 1;
      elTime.textContent = String(Math.max(0, timeLeft));
      if (timeLeft <= 0) endGame();
    }, 1000);

    function endGame(){
      running = false;
      elMsg.textContent = `終了！ Score: ${score}`;
      clearInterval(tickTimer);
      line.state = "idle";
    }

    // 初期生成
    resize();
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    takos.length = 0;
    for (let i=0; i<GAME.takoCount; i++) spawnTako(w, h);

    // ループ
    let last = performance.now();
    function loop(now){
      const dt = Math.min(33, now - last);
      last = now;

      // サイズ更新
      const W = wrap.clientWidth;
      const H = wrap.clientHeight;

      // 更新
      if (running){
        updateTakos(dt, W, H);
        updateEnemies(dt, W, H, now);
        updateLine(dt, W, H, now);
        checkCollisions(W, H, now);
      }

      // 描画
      draw(W, H, now);

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* ===== 更新 ===== */
    function updateTakos(dt, W, H){
      for (const o of takos){
        o.wob += dt;
        o.x += o.vx * dt;
        o.y += o.vy * dt + Math.sin(o.wob*0.003)*0.08;

        // 壁反射
        if (o.x < 10){ o.x = 10; o.vx *= -1; }
        if (o.x > W-10){ o.x = W-10; o.vx *= -1; }
        // 上下は浅い範囲で
        const top = H*0.30, bot = H*0.92;
        if (o.y < top){ o.y = top; o.vy *= -1; }
        if (o.y > bot){ o.y = bot; o.vy *= -1; }
      }
    }

    function updateEnemies(dt, W, H, now){
      // 観光客：左右往復（そのまま）
      tourist.x += tourist.vx * tourist.dir * (dt/16.0);
      const pad = 20;
      if (tourist.x < pad){ tourist.x = pad; tourist.dir = 1; }
      if (tourist.x > W - pad - SIZE.tourist){ tourist.x = W - pad - SIZE.tourist; tourist.dir = -1; }

      // イカ：ゆらゆら（sinで左右＋上下ふわ）
      ika.t += dt;
      const swayX = Math.sin(ika.t * 0.0022) * (W * 0.18);
      const bobY  = Math.sin(ika.t * 0.0030) * (H * 0.018);
      ika.x = (W * ika.baseX) + swayX - SIZE.ika/2;
      ika.y = (H * ika.baseY) + bobY - SIZE.ika/2;

      // 画面外に出ないように軽くクランプ
      ika.x = clamp(ika.x, 10, W - SIZE.ika - 10);
      ika.y = clamp(ika.y, H*0.70, H - SIZE.ika - 8);
    }

    function updateLine(dt, W, H, now){
      // 糸の開始位置
      const x = clamp(line.x * W, 10, W-10);
      line._px = x;
      line._py0 = line.y0;

      if (line.state === "down"){
        line.len += GAME.lineSpeed * (dt/16.0);
        if (line.len >= GAME.maxLine) line.state = "up";
      } else if (line.state === "up"){
        line.len -= GAME.reelSpeed * (dt/16.0);
        if (line.len <= 0){
          line.len = 0;
          line.state = "idle";
          // 釣れた確定（上まで戻った時）
          if (line.hasCatch){
            score += line.hasCatch.type.pts;
            elScore.textContent = String(score);
            flash(`+${line.hasCatch.type.pts} (${line.hasCatch.type.key})`);
            // 捕まえた個体を再配置（転がり続ける）
            respawnTako(line.hasCatch, W, H);
            line.hasCatch = null;
          }
        }
      }
    }

    function respawnTako(o, W, H){
      const t = pickWeighted();
      o.type = t;
      o.x = rand(20, W-20);
      o.y = rand(H*0.35, H*0.92);
      o.vx = rand(-0.55, 0.55);
      o.vy = rand(-0.18, 0.18);
      o.wob = rand(0, 9999);
    }

    /* ===== 衝突 ===== */
    function checkCollisions(W, H, now){
      if (line.state === "idle") return;

      const hookX = line._px - SIZE.pick/2;
      const hookY = line._py0 + line.len - SIZE.pick/2;

      // すでに釣れてる時は「敵ヒットだけ見る」
      if (line.hasCatch){
        // 敵に当たったら落とす（減点）
        if (hitEnemy(hookX, hookY)){
          dropCatch(now);
        }
        return;
      }

      // たこ焼きに当たったら釣る
      for (const o of takos){
        const tx = o.x - SIZE.tako/2;
        const ty = o.y - SIZE.tako/2;
        if (aabb(hookX, hookY, SIZE.pick, SIZE.pick, tx, ty, SIZE.tako, SIZE.tako)){
          line.hasCatch = o;
          line.state = "up";
          flash("HIT! 巻き上げ中…");
          break;
        }
      }

      // 敵に当たったら減点（釣れてなくても）
      hitEnemy(hookX, hookY);
    }

    function hitEnemy(hx, hy){
      const now = performance.now();
      // 観光客
      const tX = tourist.x;
      const tY = tourist.y;
      if (aabb(hx, hy, SIZE.pick, SIZE.pick, tX, tY, SIZE.tourist, SIZE.tourist)){
        score += SCORE.hitTourist;
        elScore.textContent = String(score);
        flash(`${SCORE.hitTourist}（観光客）`);
        line.stunUntil = now + GAME.stunMs;
        // すぐ巻き戻し
        line.state = "up";
        return true;
      }
      // イカ
      if (aabb(hx, hy, SIZE.pick, SIZE.pick, ika.x, ika.y, SIZE.ika, SIZE.ika)){
        score += SCORE.hitIka;
        elScore.textContent = String(score);
        flash(`${SCORE.hitIka}（イカ）`);
        line.stunUntil = now + GAME.stunMs;
        line.state = "up";
        return true;
      }
      return false;
    }

    function dropCatch(now){
      // 釣れてるものを落とす＋減点は「敵側」で済んでる想定
      if (!line.hasCatch) return;
      flash("落とした…！");
      // 落とした個体は再配置
      respawnTako(line.hasCatch, wrap.clientWidth, wrap.clientHeight);
      line.hasCatch = null;
      line.state = "up";
      line.stunUntil = now + GAME.stunMs;
    }

    /* ===== 表示 ===== */
    let flashUntil = 0;
    function flash(text){
      elMsg.textContent = text;
      flashUntil = performance.now() + 700;
    }

    function draw(W, H, now){
      // 背景
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = GAME.bg;
      ctx.fillRect(0,0,W,H);

      // 水っぽい帯
      ctx.fillStyle = GAME.water;
      ctx.fillRect(0, H*0.22, W, H*0.78);

      // たこ焼き
      for (const o of takos){
        const im = o.type.img;
        const x = o.x - SIZE.tako/2;
        const y = o.y - SIZE.tako/2;
        if (im) ctx.drawImage(im, x, y, SIZE.tako, SIZE.tako);
        else {
          ctx.fillStyle = "#ffcc66";
          ctx.fillRect(x,y,SIZE.tako,SIZE.tako);
        }
      }

      // 観光客（向き）
      const tIm = (tourist.dir === 1) ? IM.enemy.touristR : IM.enemy.touristL;
      if (tIm) ctx.drawImage(tIm, tourist.x, tourist.y, SIZE.tourist, SIZE.tourist);

      // イカ（ゆらゆら）
      if (IM.enemy.ika) ctx.drawImage(IM.enemy.ika, ika.x, ika.y, SIZE.ika, SIZE.ika);

      // 糸＆針
      const x = clamp(targetX * W, 10, W-10);
      const y0 = 18;

      // 糸（投下中/巻き上げ中だけ）
      if (line.state !== "idle"){
        const lx = line._px;
        const ly0 = line._py0;
        const ly1 = ly0 + line.len;

        // 糸
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, ly0);
        ctx.lineTo(lx, ly1);
        ctx.stroke();

        // 針
        const px = lx - SIZE.pick/2;
        const py = ly1 - SIZE.pick/2;
        if (IM.pick) ctx.drawImage(IM.pick, px, py, SIZE.pick, SIZE.pick);
        else {
          ctx.fillStyle = "#fff";
          ctx.fillRect(px, py, SIZE.pick, SIZE.pick);
        }

        // 釣れてるとき：針の上にたこ焼き表示（ぶら下がり）
        if (line.hasCatch){
          const im = line.hasCatch.type.img;
          const tx = lx - SIZE.tako/2;
          const ty = ly1 + 8;
          if (im) ctx.drawImage(im, tx, ty, SIZE.tako, SIZE.tako);
        }
      } else {
        // idle時：糸のスタン中表示（薄く）
        if (now < line.stunUntil){
          ctx.strokeStyle = "rgba(255,80,80,0.55)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y0);
          ctx.lineTo(x, y0 + 40);
          ctx.stroke();
        }
      }

      // フラッシュ消す
      if (now > flashUntil) elMsg.textContent = "";
      // 時間切れの表示
      if (!running){
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px system-ui, sans-serif";
        ctx.fillText(`FINISH!  Score: ${score}`, 18, 44);
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillText("×で閉じる / もう一度やるなら閉じて再起動", 18, 68);
      }
    }
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
