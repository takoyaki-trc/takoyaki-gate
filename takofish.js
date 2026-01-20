(() => {
  /* ==========================
     Takoyaki Fishing - JS（入口onclick対応・確実版）
     ========================== */

  // ===== モーダルHTML（生成用）=====
  function buildModalHTML(){
    return `
<div class="takofish-modal" id="tfModal" aria-hidden="false">
  <div class="takofish-modal__inner" role="dialog" aria-label="たこ焼き釣り">
    <button class="takofish-modal__close" id="tfClose" type="button" aria-label="閉じる">×</button>

    <div class="takofish-wrap">
      <div class="takofish-head">
        <div class="takofish-title">たこ焼き釣り</div>
        <div class="takofish-sub">時間内に何個釣れる？</div>
      </div>

      <div class="takofish-ui">
        <button class="takofish-btn" id="tfRetry" type="button" disabled>もう一回</button>
        <div class="takofish-stats">
          <span>スコア：<b id="tfScore">0</b></span>
          <span>残り：<b id="tfTime">30</b>s</span>
          <span>連続：<b id="tfCombo">0</b></span>
        </div>
      </div>

      <div class="takofish-canvasbox">
        <canvas id="tfCanvas" width="360" height="520"></canvas>
      </div>

      <div class="takofish-note">※閉じると終了。もう一回で連続プレイOK。</div>
    </div>
  </div>
</div>`;
  }

  // ===== 開く/閉じる =====
  function openGame(){
    // 既に開いてたら無視
    if (document.getElementById("tfModal")) return;

    document.body.insertAdjacentHTML("beforeend", buildModalHTML());

    const modal = document.getElementById("tfModal");
    const closeBtn = document.getElementById("tfClose");

    closeBtn.addEventListener("click", closeGame);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeGame();
    });

    startGame();
  }

  function closeGame(){
    stopGame();
    const modal = document.getElementById("tfModal");
    if (modal) modal.remove();
  }

  // ★ 入口onclickから呼ぶために必ず公開
  window.openTakofishGame = openGame;

  // ===== 超軽量ゲーム（表示確認用。あとで本格版に差し替えOK）=====
  let timerId = null;

  function startGame(){
    const cvs = document.getElementById("tfCanvas");
    const ctx = cvs.getContext("2d");

    // 表示確認：キャンバスに描くだけ
    ctx.clearRect(0,0,cvs.width,cvs.height);
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0,0,cvs.width,cvs.height);
    ctx.fillStyle = "#fff";
    ctx.font = "16px system-ui";
    ctx.fillText("ロード成功！🎣", 110, 80);
    ctx.font = "12px system-ui";
    ctx.fillText("ここから本格釣り版に差し替え可能", 60, 110);

    // タイマーだけ動かす
    let t = 30;
    document.getElementById("tfTime").textContent = String(t);
    timerId = setInterval(() => {
      t--;
      document.getElementById("tfTime").textContent = String(Math.max(0,t));
      if (t <= 0) stopGame();
    }, 1000);
  }

  function stopGame(){
    if (timerId) clearInterval(timerId);
    timerId = null;
  }
})();

