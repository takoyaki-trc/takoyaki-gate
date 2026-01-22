/* =========================
   idle-talk.js（放置で独り言）
   前提：
   - const TALK = { me1:{day,night,vanishLine}, ... } が定義済み
   - タコ民ボタン: .takomin[data-id="me1"] のように data-id が TALK のキーと一致
   - 吹き出し要素: .takomin-balloon が各タコ民内にある
   - 夜判定: html.is-night
========================= */
(() => {
  "use strict";

  if (typeof TALK !== "object") return;

  /* ===== 設定 ===== */
  const IDLE_MIN_MS = 90 * 1000;   // 最短：90秒で喋る（好みで変更）
  const IDLE_MAX_MS = 180 * 1000;  // 最長：180秒で喋る（好みで変更）
  const DISPLAY_MS  = 5200;        // 独り言の表示時間（ミリ秒）
  const VANISH_RATE = 0.18;        // vanishLine を混ぜる確率（0〜1）
  const NO_REPEAT_WINDOW = 3;      // 直近N回の同じキャラ連続回避

  const isNight = () => document.documentElement.classList.contains("is-night");

  /* ===== 対象タコ民収集 ===== */
  function getNpcNodes(){
    // 例：<button class="takomin" data-id="me3">...<div class="takomin-balloon"></div></button>
    return Array.from(document.querySelectorAll(".takomin[data-id]"))
      .map(el => {
        const id = el.getAttribute("data-id");
        const balloon = el.querySelector(".takomin-balloon");
        return { el, id, balloon };
      })
      .filter(x => x.id && x.balloon && TALK[x.id]);
  }

  /* ===== ランダム ===== */
  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ===== 文章選択 ===== */
  function pickLine(talkObj){
    const pool = isNight() ? (talkObj.night || []) : (talkObj.day || []);
    const hasVanish = typeof talkObj.vanishLine === "string" && talkObj.vanishLine.trim().length;
    const useVanish = isNight() && hasVanish && Math.random() < VANISH_RATE;

    if (useVanish) return talkObj.vanishLine;
    if (!pool.length) return hasVanish ? talkObj.vanishLine : "";
    return pick(pool);
  }

  /* ===== 表示 ===== */
  let hideTimer = null;
  function showBalloon(npc, text){
    if (!npc || !npc.balloon || !text) return;

    // 既存表示のリセット
    if (hideTimer) clearTimeout(hideTimer);

    npc.balloon.textContent = text;

    // もしCSSで開閉制御してるならクラス付与（無くてもOK）
    npc.balloon.classList.add("is-show");

    hideTimer = setTimeout(() => {
      npc.balloon.classList.remove("is-show");
      // テキストを消したいなら下をON
      // npc.balloon.textContent = "";
    }, DISPLAY_MS);
  }

  /* ===== キャラ選択（連続回避） ===== */
  const recent = [];
  function pickNpc(list){
    if (!list.length) return null;

    // recentに入ってないやつを優先
    const candidates = list.filter(n => !recent.includes(n.id));
    const npc = candidates.length ? pick(candidates) : pick(list);

    recent.push(npc.id);
    while (recent.length > NO_REPEAT_WINDOW) recent.shift();

    return npc;
  }

  /* ===== 放置判定 ===== */
  let idleTimer = null;

  function scheduleNext(){
    if (idleTimer) clearTimeout(idleTimer);
    const ms = randInt(IDLE_MIN_MS, IDLE_MAX_MS);
    idleTimer = setTimeout(runIdleTalk, ms);
  }

  function resetIdle(){
    scheduleNext();
  }

  function runIdleTalk(){
    const list = getNpcNodes();
    const npc = pickNpc(list);
    if (!npc) return scheduleNext();

    const talk = TALK[npc.id];
    const line = pickLine(talk);
    showBalloon(npc, line);

    // 次も継続
    scheduleNext();
  }

  /* ===== ユーザー操作でリセット ===== */
  const events = ["pointerdown","click","keydown","scroll","touchstart","mousemove"];
  let lastMoveAt = 0;

  function onAnyActivity(e){
    // mousemove だけは連打を間引く（軽量化）
    if (e.type === "mousemove"){
      const now = Date.now();
      if (now - lastMoveAt < 700) return;
      lastMoveAt = now;
    }
    resetIdle();
  }

  events.forEach(ev => window.addEventListener(ev, onAnyActivity, { passive:true }));

  /* ===== 初期スタート ===== */
  scheduleNext();

})();
