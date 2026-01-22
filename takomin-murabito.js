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
   idle-talk.js（完全版）
   - 放置時のみ発話
   - 性格（人格）をランダムで切替
   - 人格ごとに吹き出しの雰囲気が変わる
========================= */
(() => {
  "use strict";

  const TALK = window.TALK;
  const IDLE_TALK = window.IDLE_TALK;
  if (!TALK || !IDLE_TALK) return;

  /* ===== 設定 ===== */
  const IDLE_MIN = 90 * 1000;
  const IDLE_MAX = 180 * 1000;
  const DISPLAY_MS = 5200;

  const isNight = () =>
    document.documentElement.classList.contains("is-night");

  function rand(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getNpcs(){
    return Array.from(document.querySelectorAll(".takomin[data-id]"))
      .map(el => ({
        el,
        id: el.dataset.id,
        balloon: el.querySelector(".takomin-balloon")
      }))
      .filter(n => n.balloon && TALK[n.id]);
  }

  /* ===== 人格つきセリフを取得 ===== */
  function pickIdleLine(){
    const group = isNight() ? IDLE_TALK.night : IDLE_TALK.day;
    const personalities = Object.keys(group);
    const personality = pick(personalities);
    const text = pick(group[personality]);
    return { text, personality };
  }

  let hideTimer = null;
  function showBalloon(npc, text, personality){
    if (!npc || !text) return;

    const b = npc.balloon;

    // 人格クラスを全リセット
    b.className = "takomin-balloon";

    // 人格クラス付与（←切替に気づく核心）
    b.classList.add("idle-" + personality);

    b.textContent = text;
    b.classList.add("is-show");

    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      b.classList.remove("is-show");
    }, DISPLAY_MS);
  }

  let idleTimer = null;
  function schedule(){
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(runIdle, rand(IDLE_MIN, IDLE_MAX));
  }

  function reset(){
    schedule();
  }

  function runIdle(){
    const npcs = getNpcs();
    if (!npcs.length) return schedule();

    const npc = pick(npcs);
    const { text, personality } = pickIdleLine();

    showBalloon(npc, text, personality);
    schedule();
  }

  /* ===== ユーザー操作でリセット ===== */
  ["click","pointerdown","keydown","scroll","touchstart","mousemove"]
    .forEach(ev =>
      window.addEventListener(ev, reset, { passive:true })
    );

  schedule();
})();
