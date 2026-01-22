(() => {
  /* ==========================
     takofish.js（画像ロード失敗を特定できる版）
     - crossOrigin を外す（CORSで落ちるのを回避）
     - どのURLが落ちたか画面表示
     - 入口：window.openTakofishGame()
     ========================== */

  const IMG_URLS = {
    pick:    "https://ul.h3z.jp/gCjVoTJY.png",
    sauce:   "https://ul.h3z.jp/YuxvQUxC.png",
    ika:     "https://ul.h3z.jp/DBX2iMCO.png",
    gold:    "https://ul.h3z.jp/FztbamQ9.png",
    rainbow: "https://ul.h3z.jp/Y7pUK2Y7.png",
    raw:     "https://ul.h3z.jp/SRTmyd3h.png",
  };

  function buildModalHTML(){
    return `
<div class="takofish-modal" id="tfModal">
  <div class="takofish-modal__inner" role="dialog" aria-label="たこ焼き釣り">
    <button class="takofish-modal__close" id="tfClose" type="button" aria-label="閉じる">×</button>

    <div class="takofish-wrap">
      <div class="takofish-head">
        <div class="takofish-title">たこ焼き釣り</div>
        <div class="takofish-sub">画像読み込みテスト付き</div>
      </div>

      <div class="takofish-ui">
        <button class="takofish-btn" id="tfRetry" type="button">もう一回</button>
        <div class="takofish-stats">
          <span>スコア：<b id="tfScore">0</b></span>
          <span>残り：<b id="tfTime">30</b>s</span>
          <span>連続：<b id="tfCombo">0</b></span>
          <span>失敗：<b id="tfMiss">0</b></span>
        </div>
      </div>

      <div class="takofish-canvasbox">
        <canvas id="tfCanvas" width="360" height="520"></canvas>
      </div>

      <div class="takofish-note">
        ※画像が落ちたら、どのURLがダメか画面に出ます。
      </div>
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

    document.getElementById("tfRetry").addEventListener("click", () => {
      startGame().catch(console.error);
    });

    startGame().catch(console.error);
  }

  function closeGame(){
    stopGame();
    const modal = document.getElementById("tfModal");
    if (modal) modal.remove();
  }

  window.openTakofishGame = openGame;

  // ==========================
  // 画像ロード（crossOrigin なし）
  // ==========================
  function loadImageNoCORS(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      // ✅ これを付けない（CORSで落ちる原因になりやすい）
      // img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
  }

  async function loadAllImagesWithReport(){
    const keys = Object.keys(IMG_URLS);
    const images = {};
    const failed = [];

    for (const k of keys){
      try{
        images[k] = await loadImageNoCORS(IMG_URLS[k]);
      } catch(e){
        failed.push({ key:k, url:String(e.message || e) });
      }
    }
    return { images, failed };
  }

  // ==========================
  // ゲーム（ここではロード確認だけして動作継続）
  // ==========================
  let rafId = null;
  let timerId = null;
  let onPointer = null;

  async function startGame(){
    stopGame();

    const cvs = document.getElementById("tfCanvas");
    const ctx = cvs.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const W = cvs.width, H = cvs.height;

    // ロード中表示
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#fff";
    ctx.font = "16px system-ui";
    ctx.fillText("画像を読み込み中…", 95, 250);

    const { images, failed } = await loadAllImagesWithReport();

    // 失敗があるなら、どれがダメか表示して止める
    if (failed.length){
      ctx.fillStyle = "#0a1020";
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = "#fff";
      ctx.font = "14px system-ui";
      ctx.fillText("画像が読み込めないものがあります：", 20, 50);

      ctx.font = "12px system-ui";
      let y = 80;
      for (const f of failed){
        ctx.fillText(`- ${f.key}: ${f.url}`, 20, y);
        y += 18;
        if (y > H - 20) break;
      }

      ctx.fillText("対策：画像URLを別ホスト(GitHub等)に置くか、URLが生きてるか確認。", 20, H - 20);
      return;
    }

    // ✅ ここまで来たら全画像OK：簡単に表示して確認
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#fff";
    ctx.font = "14px system-ui";
    ctx.fillText("画像ロード成功！", 120, 30);

    // ピック
    ctx.drawImage(images.pick, 20, 50, 48, 48);

    // たこ焼き
    const list = ["sauce","ika","gold","rainbow","raw"];
    let x = 90;
    for (const k of list){
      ctx.drawImage(images[k], x, 52, 44, 44);
      x += 52;
    }

    ctx.font = "12px system-ui";
    ctx.fillText("←ピック  /  右：たこ焼き各種（表示できてたらOK）", 20, 110);

    // ここから先に “ゲーム本体” を繋げればOK（今回はロード問題の解消が目的）
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
