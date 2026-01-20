(() => {
  /* ==========================
     Takoyaki Fishing - JS
     外部から start/stop 可能（キャラタップ起動）
     ========================== */

  const cvs = document.getElementById("tfCanvas");
  const ctx = cvs?.getContext("2d");
  if (!cvs || !ctx) return;

  const $ = (id) => document.getElementById(id);

  // UI
  const btnRetry = $("tfRetry");
  const overlay  = $("tfOverlay");
  const msgTitle = $("tfMsgTitle");
  const msgText  = $("tfMsgText");

  const elScore = $("tfScore");
  const elTime  = $("tfTime");
  const elCombo = $("tfCombo");

  // モーダル
  const modal = $("tfModal");
  const btnClose = $("tfClose");

  // 起動キャラ（ボタン）
  const charBtn = document.querySelector(".takomin--fish");

  // 設定
  const GAME_TIME = 30;
  const FLOOR_Y_RATIO = 0.86;
  const SPAWN_INTERVAL = 650;

  // 状態
  let running = false;
  let tLeft = GAME_TIME;
  let score = 0;
  let combo = 0;
  let lastSpawn = 0;
  let rafId = 0;
  let last = 0;

  const hook = {
    x: 0.5,
    state: "idle",
    lineLen: 0,
    speed: 620,
    caught: null
  };

  const items = [];
  let pointerActive = false;

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function setOverlay(show, title, text) {
    overlay.style.display = show ? "grid" : "none";
    if (title != null) msgTitle.textContent = title;
    if (text != null) msgText.innerHTML = text;
  }

  function fitCanvas() {
    const boxW = cvs.clientWidth || 360;
    const ratio = 520 / 360;
    const boxH = Math.round(boxW * ratio);

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    cvs.width  = Math.floor(boxW * dpr);
    cvs.height = Math.floor(boxH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetState() {
    tLeft = GAME_TIME;
    score = 0;
    combo = 0;
    items.length = 0;
    lastSpawn = 0;

    hook.x = 0.5;
    hook.state = "idle";
    hook.lineLen = 0;
    hook.caught = null;

    elScore.textContent = "0";
    elTime.textContent  = String(GAME_TIME);
    elCombo.textContent = "0";

    btnRetry.disabled = true;

    setOverlay(true, "たこ焼き釣り", "左右に動かして、タップでフックを下ろせ！<br>時間内に何個釣れる？");
  }

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
      vx: (Math.random() * 2 - 1) * 26,
      r, type, base, alive: true
    });
  }

  function dropHook() {
    if (!running) return;
    if (hook.state !== "idle") return;
    hook.state = "down";
  }

  function endGame() {
    running = false;
    btnRetry.disabled = false;

    const text =
      `スコア：<b>${score}</b><br>` +
      `連続GET：<b>${combo}</b><br><br>` +
      `「もう一回」で即リトライOK🔥`;

    setOverlay(true, "結果", text);
  }

  function drawBackground(w, h) {
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, w, h);

    const floorY = h * FLOOR_Y_RATIO;
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(0, floorY, w, h - floorY);

    ctx.fillStyle = "#eaeaea";
    ctx.fillRect(0, floorY, w, 2);

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

    ctx.fillStyle = "#f3f3f3";
    ctx.fillRect(x - 16, topY - 10, 32, 6);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 1, topY, 2, hook.lineLen);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 8, y, 16, 8);
    ctx.fillRect(x - 10, y + 6, 6, 10);
    ctx.fillRect(x + 4,  y + 6, 6, 10);
    ctx.fillRect(x - 12, y + 14, 4, 4);
    ctx.fillRect(x + 8,  y + 14, 4, 4);
  }

  function drawItem(it) {
    let body = "#b87333";
    let spot = "#6b3c1a";
    let shine = "#f3d3a0";

    if (it.type === "burnt") { body = "#5a3a2a"; spot = "#2b1a12"; shine = "#b08a6b"; }
    if (it.type === "gold")  { body = "#d9b44a"; spot = "#8a6a16"; shine = "#fff2b6"; }

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.r, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = spot;
    ctx.fillRect(it.x - 6, it.y - 3, 4, 4);
    ctx.fillRect(it.x + 2, it.y + 1, 3, 3);
    ctx.fillRect(it.x - 1, it.y + 6, 3, 3);

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

    // アイテム
    for (const it of items) {
      if (!it.alive) continue;
      it.x += it.vx * dt;
      if (it.x < w*0.06 || it.x > w*0.94) it.vx *= -1;
      it.vx += (Math.random()*2 - 1) * 6 * dt;
      it.vx = clamp(it.vx, -40, 40);
      it.y = floorY - 10;
    }

    // 生成
    if (running) {
      lastSpawn += dt * 1000;
      if (lastSpawn >= SPAWN_INTERVAL) {
        lastSpawn = 0;
        const aliveCount = items.filter(x => x.alive).length;
        if (aliveCount < 7) spawnItem();
      }
    }

    // フック
    const topY = h * 0.06;
    const maxLen = floorY - topY - 18;

    if (hook.state === "down") {
      hook.lineLen += hook.speed * dt;
      if (hook.lineLen >= maxLen) {
        hook.lineLen = maxLen;
        hook.state = "up";
      }

      const hx = hook.x * w;
      const hy = topY + hook.lineLen + 12;
      for (const it of items) {
        if (!it.alive) continue;
        const dx = it.x - hx;
        const dy = it.y - hy;
        const d2 = dx*dx + dy*dy;
        if (d2 <= (it.r + 14) * (it.r + 14)) {
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
        combo = 0;
        elCombo.textContent = String(combo);
      }
    }

    if (hook.state === "caughtUp") {
      hook.lineLen -= hook.speed * dt;
      if (hook.lineLen <= 0) {
        hook.lineLen = 0;
        hook.state = "idle";

        const got = hook.caught;
        if (got) {
          combo += 1;
          elCombo.textContent = String(combo);
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

    for (const it of items) if (it.alive) drawItem(it);

    if (hook.caught) {
      const topY = h * 0.06;
      const hx = hook.x * w;
      const hy = topY + hook.lineLen + 26;
      const it = hook.caught;

      ctx.save();
      ctx.translate(hx, hy);

      let body = "#b87333", spot = "#6b3c1a", shine = "#f3d3a0";
      if (it.type === "burnt") { body = "#5a3a2a"; spot = "#2b1a12"; shine = "#b08a6b"; }
      if (it.type === "gold")  { body = "#d9b44a"; spot = "#8a6a16"; shine = "#fff2b6"; }

      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(0, 0, it.r, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = spot;
      ctx.fillRect(-6, -3, 4, 4);
      ctx.fillRect(2, 1, 3, 3);
      ctx.fillRect(-1, 6, 3, 3);

      ctx.fillStyle = shine;
      ctx.fillRect(-6, -8, 4, 3);

      ctx.restore();
    }

    drawHook(w, h);

    if (running) {
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText("タップで下ろす / SpaceでもOK", 10, 18);
    }
  }

  function loop(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;

    if (running) update(dt);
    render();

    rafId = requestAnimationFrame(loop);
  }

  // ====== 入力 ======
  function setHookXFromClient(clientX) {
    const rect = cvs.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    hook.x = clamp(x, 0.06, 0.94);
  }

  cvs.addEventListener("pointerdown", (e) => {
    pointerActive = true;
    setHookXFromClient(e.clientX);
    dropHook();
  });

  cvs.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    setHookXFromClient(e.clientX);
  });

  window.addEventListener("pointerup", () => { pointerActive = false; });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); dropHook(); }
    if (e.code === "Escape") closeModal();
  });

  // ====== モーダル制御 ======
  function openModalAndStart() {
    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // サイズ確定後にfit
    setTimeout(() => {
      fitCanvas();
      // 即スタート（アーケード感）
      startGame();
    }, 0);
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    // 閉じたら止める（CPU節約）
    stopGame();
  }

  btnClose?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // キャラタップ起動
  charBtn?.addEventListener("click", () => {
    openModalAndStart();
  });

  // ====== 外部start/stop ======
  function startGame() {
    // すでに走ってるならリセットして開始
    resetState();
    running = true;
    btnRetry.disabled = true;
    setOverlay(false);
  }

  function stopGame() {
    running = false;
  }

  btnRetry?.addEventListener("click", () => {
    // モーダルが開いてるなら即リスタート
    startGame();
  });

  // 初期化
  fitCanvas();
  resetState();
  if (!rafId) requestAnimationFrame(loop);

})();
