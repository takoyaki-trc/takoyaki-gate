/* =========================
   放置専用：特別セリフ集（性格バラバラ）
   - 通常の TALK(day/night) とは完全に別
========================= */
window.IDLE_TALK = {
  day: {
    shy: [
      "暇だ・・・",
      "誰かタップして・・・",
      "喋りたい・・・",
      "ねぇ・・・聞いて・・・",
      "ここ、ずっと立ってる・・・"
    ],
    friendly: [
      "おーい！\n誰かいる？",
      "ちょっとでいいから\n押してよ～",
      "今なら\n空いてます！",
      "暇すぎて\n景色見てた！"
    ],
    cynical: [
      "はいはい、\n放置ですね。",
      "また背景係に\n戻りました。",
      "期待しない方が\n楽だよ。",
      "……知ってた。"
    ],
    needy: [
      "一回だけでいい。",
      "押したら\nすぐ終わるから。",
      "ここにいる意味、\nあるよね？",
      "……まだ待ってる。"
    ]
  },

  night: {
    quiet: [
      "……暇だ。",
      "……喋りたい。",
      "……夜、\n長い。",
      "……声、\n届いてる？"
    ],
    needy: [
      "……タップして。",
      "……見てるなら\n触って。",
      "……反応、\n欲しい。",
      "……一人は\n嫌だ。"
    ],
    creepy: [
      "……放置、\n好きだね。",
      "……見られてるのに\n触られない。",
      "……声が\n増えてきた。",
      "……今、\n何人\n見てる？"
    ],
    resigned: [
      "……どうせ\n来ない。",
      "……朝まで\nこのまま。",
      "……待つの、\n慣れた。",
      "……それでも\n立ってる。"
    ]
  }
};

/* =========================
   takomin-talk.js（統一完全版）
   - クリック会話：tapで順番に表示 / 夜6回で消滅
   - 放置独り言：20〜45秒でランダム発話（人格クラス付与）
   - display:none 残骸で「喋ってるのに見えない」を防ぐ
   前提：
   - window.TALK = {...}
   - window.IDLE_TALK = {...}  （性格バラバラ版）
   - 夜判定：html/body の is-night を見る
========================= */
(() => {
  "use strict";

  /* ===== 夜判定（BASEと同じルール） ===== */
  function isNight(){
    return document.documentElement.classList.contains("is-night") ||
           document.body.classList.contains("is-night");
  }
  window.__isNight = isNight;

  /* ===== 必須データ ===== */
  const TALK = window.TALK;
  if (!TALK) return;

  /* =========================
     吹き出し表示（共通）
  ========================= */
  function showBalloon(btn, text, extraClass){
    const balloon = btn.querySelector(".takomin-balloon");
    if(!balloon) return;

    // ★display事故防止：必ず表示に戻す
    balloon.style.display = "block";

    // クラスをリセットして付与
    balloon.className = "takomin-balloon";
    if (extraClass) balloon.classList.add(extraClass);

    balloon.textContent = text;
    balloon.classList.add("is-show");

    clearTimeout(btn._hideTimer);
    btn._hideTimer = setTimeout(() => {
      balloon.classList.remove("is-show");
      balloon.style.display = "none";
    }, 5200);
  }

  /* =========================
     昼夜で画像差し替え
  ========================= */
  function applyImage(btn){
    const img = btn.querySelector("img");
    if(!img) return;
    const url = isNight() ? img.dataset.night : img.dataset.day;
    if(url) img.src = url;
  }

  /* =========================
     クリック会話（既存挙動）
  ========================= */
  document.querySelectorAll(".map-wrap .takomin").forEach(btn => {
    const id = btn.dataset.id;
    const data = TALK[id];
    if(!data) return;

    let tapCount = 0;

    applyImage(btn);
    setInterval(() => applyImage(btn), 1000);

    btn.addEventListener("click", () => {
      tapCount++;

      if(isNight() && tapCount >= 6){
        showBalloon(btn, data.vanishLine || "……。");
        setTimeout(() => { btn.style.display = "none"; }, 1800);
        return;
      }

      const lines = isNight()
        ? ((data.night && data.night.length) ? data.night : data.day)
        : ((data.day && data.day.length) ? data.day : data.night);

      if(!lines || !lines.length) return;

      const idx = Math.min(tapCount - 1, lines.length - 1);
      showBalloon(btn, lines[idx]);
    });
  });

  /* =========================
     放置独り言（20〜45秒）
     - window.IDLE_TALK が無い時は黙る（壊れない）
  ========================= */
  const IDLE_MIN = 20 * 1000;
  const IDLE_MAX = 45 * 1000;

  function rand(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getNpcButtons(){
    return Array.from(document.querySelectorAll(".map-wrap .takomin[data-id]"))
      .filter(btn => btn.querySelector(".takomin-balloon") && TALK[btn.dataset.id]);
  }

  function pickIdleLine(){
    const IDLE_TALK = window.IDLE_TALK;
    if(!IDLE_TALK) return null;

    const group = isNight() ? IDLE_TALK.night : IDLE_TALK.day;
    if(!group) return null;

    const personalities = Object.keys(group);
    if(!personalities.length) return null;

    const personality = pick(personalities);
    const lines = group[personality] || [];
    if(!lines.length) return null;

    return { text: pick(lines), personality };
  }

  let idleTimer = null;

  function scheduleIdle(){
    clearTimeout(idleTimer);
    idleTimer = setTimeout(runIdleTalk, rand(IDLE_MIN, IDLE_MAX));
  }

  function runIdleTalk(){
    const npcs = getNpcButtons();
    if(!npcs.length) return scheduleIdle();

    const picked = pickIdleLine();
    if(!picked) return scheduleIdle();

    const btn = pick(npcs);
    showBalloon(btn, picked.text, "idle-" + picked.personality);

    scheduleIdle();
  }

  // 操作があったらリセット（mousemoveは間引き）
  let lastMove = 0;
  function resetIdle(e){
    if(e && e.type === "mousemove"){
      const now = Date.now();
      if(now - lastMove < 700) return;
      lastMove = now;
    }
    scheduleIdle();
  }

  ["click","pointerdown","keydown","scroll","touchstart","mousemove"]
    .forEach(ev => window.addEventListener(ev, resetIdle, { passive:true }));

  scheduleIdle();

})();




