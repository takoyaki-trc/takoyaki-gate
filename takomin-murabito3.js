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
   idle-talk.js（待機起動・完全版・早口）
   - window.TALK と window.IDLE_TALK が揃うまで待つ
   - 放置時のみ独り言（20〜45秒）
   - 性格（人格）をランダムで切替
========================= */
(() => {
  "use strict";

  /* ===== 設定 ===== */
  const IDLE_MIN = 20 * 1000;   // 最短 20秒
  const IDLE_MAX = 45 * 1000;   // 最長 45秒
  const DISPLAY_MS = 5200;      // 表示時間

  function rand(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ✅ 夜判定：BASE側の isNight を優先（無ければ html.is-night）
  const isNight = () => {
    if (typeof window.__isNight === "function") return !!window.__isNight();
    return document.documentElement.classList.contains("is-night");
  };

  function getNpcs(TALK){
    return Array.from(document.querySelectorAll(".takomin[data-id]"))
      .map(el => ({
        el,
        id: el.dataset.id,
        balloon: el.querySelector(".takomin-balloon")
      }))
      .filter(n => n.balloon && TALK && TALK[n.id]);
  }

  function pickIdleLine(IDLE_TALK){
    const group = isNight() ? IDLE_TALK.night : IDLE_TALK.day;
    if (!group) return { text:"", personality:"" };

    const personalities = Object.keys(group);
    if (!personalities.length) return { text:"", personality:"" };

    const personality = pick(personalities);
    const lines = group[personality] || [];
    if (!lines.length) return { text:"", personality };

    return { text: pick(lines), personality };
  }

  let hideTimer = null;
  function showBalloon(npc, text, personality){
    if (!npc || !npc.balloon || !text) return;

    const b = npc.balloon;

    // 人格クラスをリセット（安全重視）
    b.className = "takomin-balloon";

    if (personality) b.classList.add("idle-" + personality);

    b.textContent = text;
    b.classList.add("is-show");

    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      b.classList.remove("is-show");
    }, DISPLAY_MS);
  }

  let idleTimer = null;
  function schedule(runFn){
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(runFn, rand(IDLE_MIN, IDLE_MAX));
  }

  function start(){
    const TALK = window.TALK;
    const IDLE_TALK = window.IDLE_TALK;
    if (!TALK || !IDLE_TALK) return false;

    function runIdle(){
      const npcs = getNpcs(TALK);
      if (!npcs.length) return schedule(runIdle);

      const npc = pick(npcs);
      const { text, personality } = pickIdleLine(IDLE_TALK);

      showBalloon(npc, text, personality);
      schedule(runIdle);
    }

    // ユーザー操作でリセット
    const reset = () => schedule(runIdle);
    ["click","pointerdown","keydown","scroll","touchstart","mousemove"]
      .forEach(ev => window.addEventListener(ev, reset, { passive:true }));

    schedule(runIdle);
    return true;
  }

  // ✅ TALK/IDLE_TALK が揃うまで待機して起動（順番事故を潰す）
  const WAIT_LIMIT_MS = 10000; // 10秒待っても揃わなければ諦め
  const startedAt = Date.now();

  (function boot(){
    if (start()) return;
    if (Date.now() - startedAt > WAIT_LIMIT_MS) return;
    setTimeout(boot, 200);
  })();

})();


