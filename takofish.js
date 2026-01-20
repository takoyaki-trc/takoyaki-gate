(() => {
  /* ==========================
     Takoyaki Fishing
     モーダルHTMLをJSで生成する版
     ========================== */

  const ENTRY_SELECTOR = ".takomin--fish";

  // ===== モーダルHTML（生成用テンプレ） =====
  function buildModalHTML(){
    return `
<div class="takofish-modal" id="tfModal">
  <div class="takofish-modal__inner" role="dialog" aria-label="たこ焼き釣り">
    <button class="takofish-modal__close" id="tfClose" type="button">×</button>

    <div class="takofish-wrap">
      <div class="takofish-head">
        <div class="takofish-title">たこ焼き釣り</div>
        <div class="takofish-sub">時間内に何個釣れる？</div>
      </div>

      <div class="takofish-ui">
        <button class="takofish-btn" id="tfRetry" disabled>もう一回</button>
        <div class="takofish-stats">
          <span>スコア：<b id="tfScore">0</b></span>
          <span>残り：<b id="tfTime">30</b>s</span>
          <span>連続：<b id="tfCombo">0</b></span>
        </div>
      </div>

      <div class="takofish-canvasbox">
        <canvas id="tfCanvas" width="360" height="520"></canvas>
      </div>
    </div>
  </div>
</div>`;
  }

  // ===== 開く =====
  function openGame(){
    // すでに開いてたら何もしない
    if (document.getElementById("tfModal")) return;

    document.body.insertAdjacentHTML("beforeend", buildModalHTML());

    const modal = document.getElementById("tfModal");
    const closeBtn = document.getElementById("tfClose");

    closeBtn.addEventListener("click", closeGame);
    modal.addEventListener("click", e => {
      if (e.target === modal) closeGame();
    });

    // ここでゲーム初期化
    startGame();
  }

  // ===== 閉じる =====
  function closeGame(){
    const modal = document.getElementById("tfModal");
    if (!modal) return;
    modal.remove();
    stopGame();
  }

  // ===== ゲーム本体（超簡略アーケード版） =====
  let running = false;
  let time = 30;
  let timerId = null;

  function startGame(){
    const cvs = document.getElementById("tfCanvas");
    const ctx = cvs.getContext("2d");

    running = true;
    time = 30;
    document.getElementById("tfTime").textContent = time;

    timerId = setInterval(() => {
      time--;
      document.getElementById("tfTime").textContent = time;
      if (time <= 0) stopGame();
    }, 1000);

    // 仮描画（あとで釣りロジック差し替えOK）
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,cvs.width,cvs.height);
    ctx.fillStyle = "#fff";
    ctx.fillText("🎣 たこ焼き釣り中…", 40, 80);
  }

  function stopGame(){
    running = false;
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  // ===== 入口ボタン =====
  document.addEventListener("click", e => {
    const btn = e.target.closest(ENTRY_SELECTOR);
    if (!btn) return;
    e.preventDefault();
    openGame();
  });

})();

