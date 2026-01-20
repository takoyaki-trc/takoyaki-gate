(() => {
  "use strict";

  /* ===============================
     設定
  =============================== */

  // 通常時（職人が出てない時間）のモーダル画像
  const NORMAL_PHOTO = "https://ul.h3z.jp/i7T64HBV.png"; // ←通常の画像にしたいURL
  const NORMAL_TITLE = "職人の祭壇";
  const NORMAL_DESC  = "今だけ5分間のレア祭壇です。";

  // 5人の職人：各 1日5分（JST）
  // ★ photo は必ずあなたの職人画像URLに置き換えて
  const CRAFTSMEN = [
    { id:"craft_01", name:"職人①", time:"12:00", photo:"https://ul.h3z.jp/REPLACE_1.png" },
    { id:"craft_02", name:"職人②", time:"14:00", photo:"https://ul.h3z.jp/REPLACE_2.png" },
    { id:"craft_03", name:"職人③", time:"16:00", photo:"https://ul.h3z.jp/REPLACE_3.png" },
    { id:"craft_04", name:"職人④", time:"18:00", photo:"https://ul.h3z.jp/REPLACE_4.png" },
    { id:"craft_05", name:"職人⑤", time:"20:00", photo:"https://ul.h3z.jp/REPLACE_5.png" },
  ];

  const WINDOW_MIN = 5; // 出現時間（分）

  /* ===============================
     ユーティリティ
  =============================== */
  const $ = (sel, root=document) => root.querySelector(sel);
  const byId = (id) => document.getElementById(id);

  function pad(n){ return String(n).padStart(2,"0"); }

  function todayKeyJST(){
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function jstStampHM(){
    const d = new Date();
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function timeToMin(hhmm){
    const [h,m] = hhmm.split(":").map(Number);
    return (h*60 + m);
  }

  function getActiveCraftsman(){
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();
    for (const c of CRAFTSMEN){
      const start = timeToMin(c.time);
      const end = start + WINDOW_MIN;
      if (nowMin >= start && nowMin < end) return c;
    }
    return null;
  }

  /* ===============================
     DOM
  =============================== */
  const gate = $(".spot--gate");
  if (!gate) return;

  // タップを奪われない保険（アイコンが上に乗ってても押せる）
  const iconImg = $(".spot__icon", gate);
  if (iconImg) iconImg.style.pointerEvents = "none";

  const modal  = byId("gateModal");
  const panel  = modal ? modal.querySelector(".gate-modal__panel") : null;

  const mPhoto = byId("gateModalPhoto");
  const mTitle = byId("gateModalTitle");
  const mDesc  = byId("gateModalDesc");

  const btnCancel = byId("gateModalCancel");
  const btnGo = byId("gateModalGo"); // HTMLに残っててもOK（CSSで非表示でOK）

  const craftClaim = byId("craftClaim");
  const craftResult = byId("craftResult");
  const craftResultText = byId("craftResultText");

  if (!modal || !mPhoto || !mTitle || !mDesc || !craftResult || !craftResultText) return;

  /* ===============================
     取得（同端末・同日・職人ごとに1回）
  =============================== */
  function claimedKey(craftId){
    return `craft_claimed_${todayKeyJST()}_${craftId}`;
  }
  function serialKey(craftId){
    return `craft_serial_${todayKeyJST()}_${craftId}`;
  }
  function nextSerial(craftId){
    const k = serialKey(craftId);
    const n = (Number(localStorage.getItem(k)) || 0) + 1;
    localStorage.setItem(k, String(n));
    return String(n).padStart(3, "0");
  }

  function claimOrGetText(c){
    const k = claimedKey(c.id);
    const already = localStorage.getItem(k);
    if (already) return already;

    const serial = nextSerial(c.id);
    const time = new Date().toLocaleString("ja-JP");

    const text =
`【職人レア枠 取得】
職人：${c.name}
取得日時：${time}
取得No：${serial}

#たこ焼きトレカ #たこ焼きゲート`;

    localStorage.setItem(k, text);
    return text;
  }

  /* ===============================
     モーダル開閉
  =============================== */
  function openModal(){
    const c = getActiveCraftsman();

    // ★ここが重要：職人画像（モーダル上の画像）を必ずセットする
    mPhoto.src = (c && c.photo) ? c.photo : NORMAL_PHOTO;

    mTitle.textContent = c ? `${c.name} の祭壇` : NORMAL_TITLE;

    // 「取得しますか？」は出さない。開いた時点で取得日時を表示したいならここ。
    mDesc.textContent = c
      ? `${NORMAL_DESC}\n\n取得日時：${jstStampHM()}`
      : NORMAL_DESC;

    // 使わない要素は非表示（壊さないために存在しててもOK）
    if (btnGo) btnGo.href = "#";
    if (craftClaim) craftClaim.style.display = "none";

    craftResult.style.display = "none";
    craftResultText.textContent = "";

    // 職人出現中だけ：自動で結果を表示
    if (c){
      const text = claimOrGetText(c);
      craftResultText.textContent = text;
      craftResult.style.display = "block";
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  // 祭壇タップ
  gate.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  // 戻る
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  // 背景クリックで閉じる（パネル内は閉じない）
  modal.addEventListener("click", (e) => {
    if (panel && panel.contains(e.target)) return;
    closeModal();
  });

})();
