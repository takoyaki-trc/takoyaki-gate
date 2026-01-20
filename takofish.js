(() => {
  /* ==========================
     takofish.js（確実に動く：入口→モーダル生成）
     使い方：
     - HTML側で window.openTakofishGame() を呼ぶ
     ========================== */

  // ===== モーダルHTML（生成用）=====
  function buildModalHTML(){
    return `
<div class="takofish-modal" id="tfModal">
  <div class="takofish-modal__inner" role="dialog" aria-label="たこ焼き釣り">
    <button class="takofish-modal__close" id="tfClose" type="button" aria-label="閉じる">×</button>

    <div class="takofish-wrap">
      <div class="takofish-head">
        <div class="takofish-title">たこ焼き釣り</div>
        <div class="takofish-sub">時間内に何個釣れる？</div>
      </div>

      <div class="takofish-ui">
        <button class="takofish-btn" id="tfRetry" type="button">もう一回</button>
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

  function openGame(){
    // 二重起動防止
    if (document.getElementById("tfModal")) return;

    document.body.insertAdjacentHTML("beforeend", buildModalHTML());

    const modal = document.getElementById("tfModal");
    const closeBtn = document.getElementById("tfClose");
    const retryBtn = document.getElementById("tfRetry");

    closeBtn.addEventListener("click", closeGame);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeGame(); });
    retryBtn.addEventListener("click", () => startDemo(true));

    startDemo(false);
  }

  function closeGame(){
    stopDemo();
    const modal = document.getElementById("tfModal");
    if (modal) modal.remove();
  }

  // ★ここが肝：HTML側から呼べるようにする
  window.openTakofishGame = openGame;

  // ===== 動作確認用ミニデモ（タップでスコア加算）=====
  let timerId = null;
  let onTap = null;

  function startDemo(){
    stopDemo();

    const cvs = document.getElementById("tfCanvas");
    const ctx = cvs.getContext("2d");

    const scoreEl = document.getElementById("tfScore");
    const timeEl  = document.getElementById("tfTime");
    const comboEl = document.getElementById("tfCombo");

    let t = 30;
    let score = 0;
    let combo = 0;

    function draw(){
      ctx.fillStyle = "#0a1020";
      ctx.fillRect(0,0,cvs.width,cvs.height);

      ctx.fillStyle = "#fff";
      ctx.font = "14px system-ui";
      ctx.fillText("タップで釣る（動作確認）", 85, 40);

      // たこ焼きっぽい丸
      ctx.fillStyle = "#b87333";
      ctx.beginPath();
      ctx.arc(180, 280, 42, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = "#6b3c1a";
      ctx.fillRect(164, 270, 8, 8);
      ctx.fillRect(194, 292, 7, 7);

      ctx.fillStyle = "#f3d3a0";
      ctx.fillRect(164, 255, 10, 6);
    }

    draw();

    onTap = () => {
      combo++;
      score += 10 + Math.min(30, combo * 2);
      scoreEl.textContent = String(score);
      comboEl.textContent = String(combo);
      draw();
    };

    cvs.addEventListener("pointerdown", onTap);

    timeEl.textContent = String(t);
    scoreEl.textContent = String(score);
    comboEl.textContent = String(combo);

    timerId = setInterval(() => {
      t--;
      timeEl.textContent = String(Math.max(0,t));
      if (t <= 0) {
        stopDemo();
        ctx.fillStyle = "rgba(0,0,0,.65)";
        ctx.fillRect(0,0,cvs.width,cvs.height);
        ctx.fillStyle = "#fff";
        ctx.font = "18px system-ui";
        ctx.fillText("TIME UP!", 125, 230);
      }
    }, 1000);
  }

  function stopDemo(){
    if (timerId) clearInterval(timerId);
    timerId = null;

    const cvs = document.getElementById("tfCanvas");
    if (cvs && onTap) {
      cvs.removeEventListener("pointerdown", onTap);
    }
    onTap = null;
  }
})();
