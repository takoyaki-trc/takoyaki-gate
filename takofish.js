
(() => {
  /* ==========================
     Takoyaki Fishing - JS
     仕様：軽量版（当たり判定＆引き上げ）
     操作：左右移動 → スペース/タップで下ろす → 自動で引き上げ
     ========================== */

  const cvs = document.getElementById("tfCanvas");
  const ctx = cvs?.getContext("2d");
  if (!cvs || !ctx) return;

  const $ = (id) => document.getElementById(id);
  const btnStart = $("tfStart");
  const btnRetry = $("tfRetry");
  const elScore = $("tfScore");
  const elTime  = $("tfTime");
  const elCombo = $("tfCombo");

  const overlay = $("tfOverlay");
  const msgTitle = $("tfMsgTitle");
  const msgText  = $("tfMsgText");

  // ゲーム設定
  const GAME_TIME = 30;     // 秒
  const FLOOR_Y_RATIO = 0.86; // 水面/鉄板っぽいライン
  const SPAWN_INTERVAL = 650; // ms

  // 状態
  let running = false;
  let tLeft = GAME_TIME;
  let score = 0;
  let combo = 0;

  // フック
  const hook = {
    x: 0.5,          // 0..1 (canvas比)
    y: 0.12,         // 上端から開始
    state: "idle",   // idle | down | up | caughtUp
    lineLen: 0,
    speed: 620,      // px/sec
    caught: null     // caught item ref
  };

  // たこ焼き（落ちてくるターゲット）
  const items = [];
  let lastSpawn = 0;

  // 入力
  let pointerActive = false;

  // 高DPI対応
  function fitCanvas() {
    const boxW = cvs.clientWidth;
    const ratio = 520 / 360; // 縦横比（初期）
    const boxH = Math.round(boxW * ratio);

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    cvs.width  = Math.floor(boxW * dpr);
    cvs.height = Math.floor(boxH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 描画はCSSピクセル基準
  }

  function setOverlay(show, title, text) {
    overlay.style.display = show ? "grid" : "none";
    if (title != null) msgTitle.textContent = title;
    if (text != null) msgText.innerHTML = text;
  }

  function resetGame() {
    running = false;
    tLeft = GAME_TIME;
    score = 0;
    combo = 0;
    items.length = 0;
    hook.x = 0.5;
    hook.state = "idle";
    hook.lineLen = 0;
    hook.caught = null;

    elScore.textContent = String(score);
    elTime.textContent  = String(tLeft);
    elCombo.textContent = String(combo);

    btnRetry.disabled = true;
    btnStart.disabled = false;

    setOverlay(true, "たこ焼き釣り", "スタートで開始！<br>フックを左右に動かして、下ろして引き上げよう。");
  }

  // たこ焼き生成（レア度：普通/焦げ/金）
  function spawnItem() {
    const w = cvs.clientWidth;
    const h = cvs.clientHeight;

    const typeRoll = Math.random();
    let type = "normal";
    let base = 10;
    let r = 14;

    if (typeRoll < 0.12) { type = "gold"; base = 50; r = 13; }
    else if (typeRoll < 0.28) { type = "burnt"; base = 5; r = 15; }

    items.push({
      x: Math.random() * (w * 0.86) + (w * 0.07),
      y: h * (FLOOR_Y_RATIO - 0.02),
      vx: (Math.random() * 2 - 1) * 26,  // ふらふら
      r,
      type,
      base,
      alive: true
    });
  }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  // 入力：左右移動
  function setHookXFromClient(clientX) {
    const rect = cvs.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width; // 0..1
    hook.x = clamp(x, 0.06, 0.94);
  }

  // 下ろす（スペース/タップ）
  function dropHook() {
    if (!running) return;
    if (hook.state !== "idle") return;
    hook.state = "down";
  }

  function endGame() {
    running = false;
    btnRetry.disabled = false;
    btnStart.disabled = true;

    const text =
      `スコア：<b>${score}</b><br>` +
      `連続GET：<b>${combo}</b><br><br>` +
      `もう一回で再挑戦できるよ。<br>` +
      `スクショして自慢してOK🔥`;

    setOverlay(true, "結果", text);
  }

  // 描画（ドットっぽくシンプルに）
  function drawBackground(w, h) {
    // 空（上）→鉄板（下）
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, w, h);

    const floorY = h * FLOOR_Y_RATIO;
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(0, floorY, w, h - floorY);

    // ライン
    ctx.fillStyle = "#eaeaea";
    ctx.fillRect(0, floorY, w, 2);

    // 小さなドットノイズ（軽く）
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    for (let i=0;i<70;i++){
      const x = (i * 41) % w;
      const y = (i * 67) % h;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawHook(w, h) {
    const topY = h * 0.06;
    const x = hook.x * w;
    const y = topY + hook.lineLen;

    // 支点
    ctx.fillStyle = "#f3f3f3";
    ctx.fillRect(x - 16, topY - 10, 32, 6);

    // 糸
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 1, topY, 2, hook.lineLen);

    // フック本体（簡略）
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 8, y, 16, 8);

    // 針
    ctx.fillRect(x - 10, y + 6, 6, 10);
    ctx.fillRect(x + 4,  y + 6, 6, 10);

    // 針先
    ctx.fillRect(x - 12, y + 14, 4, 4);
    ctx.fillRect(x + 8,  y + 14, 4, 4);
  }

  function drawItem(it) {
    const w = cvs.clientWidth;
    const h = cvs.clientHeight;

    // たこ焼き（色でレア感）
    let body = "#b87333";
    let spot = "#6b3c1a";
    let shine = "#f3d3a0";

    if (it.type === "burnt") { body = "#5a3a2a"; spot = "#2b1a12"; shine = "#b08a6b"; }
    if (it.type === "gold")  { body = "#d9b44a"; spot = "#8a6a16"; shine = "#fff2b6"; }

    // 丸
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.r, 0, Math.PI*2);
    ctx.fill();

    // 焼き斑点
    ctx.fillStyle = spot;
    ctx.fillRect(it.x - 6, it.y - 3, 4, 4);
    ctx.fillRect(it.x + 2, it.y + 1, 3, 3);
    ctx.fillRect(it.x - 1, it.y + 6, 3, 3);

    // ハイライト
    ctx.fillStyle = shine;
    ctx.fillRect(it.x - 6, it.y - 8, 4, 3);
  }

  function update(dt) {
    const w = cvs.clientWidth;
    const h = cvs.clientHeight;
    const floorY = h * FLOOR_Y_RATIO;

    // タイマー
    if (running) {
      tLeft -= dt;
      if (tLeft <= 0) {
        tLeft = 0;
        elTime.textContent = "0";
        endGame();
        return;
      }
      elTime.textContent = String(Math.ceil(tLeft));
    }

    // アイテム移動（ふらふら）
    for (const it of items) {
      if (!it.alive) continue;
      it.x += it.vx * dt;
      if (it.x < w*0.06 || it.x > w*0.94) it.vx *= -1;
      // 水平微揺れ
      it.vx += (Math.random()*2 - 1) * 6 * dt;
      it.vx = clamp(it.vx, -40, 40);
      // yは固定（鉄板上）
      it.y = floorY - 10;
    }

    // 生成
    if (running) {
      lastSpawn += dt * 1000;
      if (lastSpawn >= SPAWN_INTERVAL) {
        lastSpawn = 0;
        // 最大個数を制限
        const aliveCount = items.filter(x => x.alive).length;
        if (aliveCount < 7) spawnItem();
      }
    }

    // フック動作
    const topY = h * 0.06;
    const maxLen = floorY - topY - 18;

    if (hook.state === "down") {
      hook.lineLen += hook.speed * dt;
      if (hook.lineLen >= maxLen) {
        hook.lineLen = maxLen;
        hook.state = "up";
      }

      // 当たり判定（フック先端あたり）
      const hx = hook.x * w;
      const hy = topY + hook.lineLen + 12; // 針位置
      for (const it of items) {
        if (!it.alive) continue;
        const dx = it.x - hx;
        const dy = it.y - hy;
        const d2 = dx*dx + dy*dy;
        if (d2 <= (it.r + 14) * (it.r + 14)) {
          // 捕獲
          it.alive = false;
          hook.caught = it;
          hook.state = "caughtUp";
          break;
        }
      }
    }

    if (hook.state === "up") {
      hook.lineLen -= hook.speed * dt;
      if (hook.lineLen <= 0) {
        hook.lineLen = 0;
        hook.state = "idle";
        hook.caught = null;
        // 取り逃し → コンボ切れ
        combo = 0;
        elCombo.textContent = String(combo);
      }
    }

    if (hook.state === "caughtUp") {
      hook.lineLen -= hook.speed * dt;
      if (hook.lineLen <= 0) {
        hook.lineLen = 0;
        hook.state = "idle";

        // 得点
        const got = hook.caught;
        if (got) {
          combo += 1;
          elCombo.textContent = String(combo);

          // コンボで加点
          const bonus = Math.min(30, combo * 2);
          score += (got.base + bonus);
          elScore.textContent = String(score);
        }
        hook.caught = null;
      }
    }
  }

  function render() {
    const w = cvs.clientWidth;
    const h = cvs.clientHeight;

    drawBackground(w, h);

    // アイテム描画
    for (const it of items) {
      if (!it.alive) continue;
      drawItem(it);
    }

    // 捕獲中アイテム（フックにくっつけて表示）
    if (hook.caught) {
      const topY = h * 0.06;
      const hx = hook.x * w;
      const hy = topY + hook.lineLen + 26;
      const it = hook.caught;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.beginPath();
      ctx.arc(0, 0, it.r, 0, Math.PI*2);
      // 色はタイプで
      let body = "#b87333", spot = "#6b3c1a", shine = "#f3d3a0";
      if (it.type === "burnt") { body = "#5a3a2a"; spot = "#2b1a12"; shine = "#b08a6b"; }
      if (it.type === "gold")  { body = "#d9b44a"; spot = "#8a6a16"; shine = "#fff2b6"; }

      ctx.fillStyle = body; ctx.fill();
      ctx.fillStyle = spot;
      ctx.fillRect(-6, -3, 4, 4);
      ctx.fillRect(2, 1, 3, 3);
      ctx.fillRect(-1, 6, 3, 3);
      ctx.fillStyle = shine;
      ctx.fillRect(-6, -8, 4, 3);
      ctx.restore();
    }

    drawHook(w, h);

    // UIヒント（プレイ中だけ）
    if (running) {
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText("下ろす：タップ / Space", 10, 18);
    }
  }

  // ループ
  let last = 0;
  function loop(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;

    if (running) update(dt);
    render();

    requestAnimationFrame(loop);
  }

  // イベント
  btnStart.addEventListener("click", () => {
    if (running) return;
    running = true;
    btnStart.disabled = true;
    btnRetry.disabled = true;
    setOverlay(false);
    lastSpawn = 0;
  });

  btnRetry.addEventListener("click", () => {
    resetGame();
    // リトライは押した後にスタートを押す設計
  });

  // キー操作（スペースで下ろす）
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      dropHook();
    }
  });

  // canvas上の操作
  cvs.addEventListener("pointerdown", (e) => {
    pointerActive = true;
    setHookXFromClient(e.clientX);
    dropHook(); // タップで下ろす
  });

  cvs.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    setHookXFromClient(e.clientX);
  });

  window.addEventListener("pointerup", () => {
    pointerActive = false;
  });

  // リサイズ
  window.addEventListener("resize", () => {
    fitCanvas();
  });

  // 初期化
  fitCanvas();
  resetGame();
  requestAnimationFrame(loop);
})();
