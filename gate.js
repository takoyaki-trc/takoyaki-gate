(() => {
  "use strict";

  /* ===============================
     設定
  =============================== */
  const NORMAL_DEST = {
    name: "たこ焼きゲート",
    url: "https://takoyakinana.1net.jp/",
    icon: "https://ul.h3z.jp/G9HOojAP.png",
    photo: "https://ul.h3z.jp/zqoEDppD.jpg"
  };

  const CRAFT_DEST = {
    isCraft: true,
    craftId: "craft_now_001",
    name: "🔥 職人の祭壇 🔥",
    url: "https://takoyakinana.1net.jp/",
    icon: "https://ul.h3z.jp/4S5Luahq.png",
    photo: "https://ul.h3z.jp/Cervm9Sn.png"
  };

  // ★テスト中だけ true（本番は必ず false）
  const RESET_TEST = false;

  // ★職人ステージ継続時間（ms）
  const CRAFT_LIMIT_MS = 5 * 60 * 1000;

  /* ===============================
     ユーティリティ
  =============================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const byId = (id) => document.getElementById(id);

  const isNight = () => document.documentElement.classList.contains("is-night");

  // ★JSTの「今日」キー（UTCズレ対策）
  function todayKeyJST(){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // ★職人ステージ：5分過ぎたら自動リセット（終わりっぱなし防止）
  function isCraftTime(){
    const now = Date.now();
    const k = "craft_start_time";
    const startRaw = localStorage.getItem(k);

    if (!startRaw){
      localStorage.setItem(k, String(now));
      return true;
    }

    const start = Number(startRaw);
    if (Number.isFinite(start) && (now - start) < CRAFT_LIMIT_MS){
      return true;
    }

    // 期限切れ → リセットして通常に戻す
    localStorage.removeItem(k);
    return false;
  }

  /* ===============================
     DOM取得
  =============================== */
  const gate = $(".spot--gate");
  if (!gate) return;

  const baseImg = $(".spot__base", gate);
  const iconImg = $(".spot__icon", gate);

  const modal  = byId("gateModal");
  const mPhoto = byId("gateModalPhoto");
  const mTitle = byId("gateModalTitle");
  const mDesc  = byId("gateModalDesc");
  const btnGo  = byId("gateModalGo");
  const btnCancel = byId("gateModalCancel");

  const craftClaim = byId("craftClaim");
  const craftNick  = byId("craftNick");
  const craftGetBtn = byId("craftGetBtn");

  const craftResult = byId("craftResult");
  const craftResultText = byId("craftResultText");

  const craftImgBtn = byId("craftImgBtn");
  const craftImgWrap = byId("craftImgWrap");
  const craftImgPreview = byId("craftImgPreview");

  /* ===============================
     （保険）必須要素が欠けてたら分かるようにする
  =============================== */
  function assertEl(el, name){
    if (!el) {
      console.warn(`[gate.js] Missing element: ${name}`);
      return false;
    }
    return true;
  }

  // craft系は「職人タイム」だけ使うが、無いとボタン反応しない原因になる
  const hasCraftUI =
    assertEl(craftClaim, "craftClaim") &&
    assertEl(craftNick, "craftNick") &&
    assertEl(craftGetBtn, "craftGetBtn") &&
    assertEl(craftResult, "craftResult") &&
    assertEl(craftResultText, "craftResultText") &&
    assertEl(craftImgBtn, "craftImgBtn") &&
    assertEl(craftImgWrap, "craftImgWrap") &&
    assertEl(craftImgPreview, "craftImgPreview");

  /* ===============================
     表示切替（昼夜土台）
  =============================== */
  function applyBase(){
    if (!baseImg) return;
    const url = isNight() ? baseImg.dataset.night : baseImg.dataset.day;
    if (url && baseImg.src !== url) baseImg.src = url;
  }

  /* ===============================
     表示切替（アイコン＝通常/職人）
  =============================== */
  function applyIcon(){
    const dest = isCraftTime() ? CRAFT_DEST : NORMAL_DEST;
    gate._dest = dest;
    if (iconImg && dest.icon && iconImg.src !== dest.icon) {
      iconImg.src = dest.icon;
    }
  }

  /* ===============================
     モーダル制御
  =============================== */
  function resetCraftUI(dest){
    if (!hasCraftUI) return;

    // 職人タイムのみ表示
    craftClaim.style.display = dest.isCraft ? "block" : "none";

    // 入力＆結果＆画像をリセット
    craftNick.value = "";
    craftResult.style.display = "none";
    craftResultText.textContent = "";
    craftImgWrap.style.display = "none";
    // ★「取得後にだけ」表示
    craftImgBtn.style.display = "none";
  }

  function openModal(dest){
    // モーダルが無い環境（念のため）
    if (!modal) {
      window.open(dest.url, "_blank", "noopener");
      return;
    }

    if (mPhoto) mPhoto.src = dest.photo || "";
    if (mTitle) mTitle.textContent = dest.isCraft ? "職人の祭壇" : "たこ焼きゲート";

    if (mDesc){
      mDesc.textContent = dest.isCraft
        ? "今だけ5分間のレア祭壇です。\n取得しますか？"
        : "たこ焼きページへ移動しますか？";
    }

    if (btnGo) btnGo.href = dest.url || "#";

    resetCraftUI(dest);

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(){
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  /* ===============================
     取得処理（同端末・同日・同職人 1回）
  =============================== */
  function claimedKey(craftId){
    return `craft_claimed_${todayKeyJST()}_${craftId}`;
  }
  function serialKey(craftId){
    return `craft_serial_${todayKeyJST()}_${craftId}`;
  }

  function getClaimedText(craftId){
    return localStorage.getItem(claimedKey(craftId));
  }
  function setClaimedText(craftId, text){
    localStorage.setItem(claimedKey(craftId), text);
  }

  function nextSerial(craftId){
    const k = serialKey(craftId);
    const n = (Number(localStorage.getItem(k)) || 0) + 1;
    localStorage.setItem(k, String(n));
    return String(n).padStart(3, "0");
  }

  function showResult(text){
    if (!hasCraftUI) return;
    craftResultText.textContent = text;
    craftResult.style.display = "block";
    // ★取得後にだけ表示
    craftImgBtn.style.display = "block";
  }

  if (hasCraftUI && craftGetBtn){
    craftGetBtn.addEventListener("click", () => {
      const dest = gate._dest;
      if (!dest || !dest.isCraft) return;

      const already = getClaimedText(dest.craftId);
      if (already){
        alert("本日は取得済みです（同じ端末では1日1回）");
        showResult(already);
        return;
      }

      const nick = craftNick.value.trim();
      if (!nick) {
        alert("ニックネームを入れてください");
        return;
      }

      const serial = nextSerial(dest.craftId);
      const time = new Date().toLocaleString("ja-JP");

      const text =
`【職人レア枠 取得】
取得日時：${time}
取得No：${serial}
ニックネーム：${nick}

#たこ焼きトレカ #たこ焼きゲート`;

      setClaimedText(dest.craftId, text);
      showResult(text);
    });
  }

  /* ===============================
     X用画像生成（スクショ代わり）
  =============================== */
  async function makeShareImage(){
    if (!hasCraftUI) return;

    const txt = craftResultText.textContent.trim();
    if (!txt){
      alert("先に『取得する（レア枠）』を押してね。");
      return;
    }

    if (typeof window.html2canvas !== "function"){
      alert("html2canvas が読み込めていません。scriptタグを確認してね。");
      return;
    }

    craftResult.style.display = "block";

    // 見栄え（背景）
    const prevBg = craftResult.style.backgroundColor;
    const prevPad = craftResult.style.padding;
    craftResult.style.backgroundColor = prevBg || "#000";
    craftResult.style.padding = prevPad || "12px";

    const canvas = await html2canvas(craftResult, {
      backgroundColor: "#000",
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    craftResult.style.backgroundColor = prevBg;
    craftResult.style.padding = prevPad;

    const dataUrl = canvas.toDataURL("image/png");
    craftImgPreview.src = dataUrl;
    craftImgWrap.style.display = "block";

    alert("画像を作ったよ！画像を長押し/右クリックで保存して、Xに貼ってね。");
  }

  if (hasCraftUI && craftImgBtn){
    craftImgBtn.addEventListener("click", (e) => {
      e.preventDefault();
      makeShareImage();
    });
  }

  /* ===============================
     ★ テスト用：取得済みを自動リセット（本番は必ずfalse）
  =============================== */
  if (RESET_TEST){
    const craftId = CRAFT_DEST.craftId;
    localStorage.removeItem(claimedKey(craftId));
    localStorage.removeItem(serialKey(craftId));
    localStorage.removeItem("craft_start_time");
    console.log("[gate.js] RESET_TEST: cleared claimed/serial/craft_start_time");
  }

  /* ===============================
     初期化
  =============================== */
  applyBase();
  applyIcon();

  // 昼夜切替追従
  new MutationObserver(applyBase).observe(document.documentElement, { attributes: true });

  // アイコン切替（職人タイム判定）
  setInterval(applyIcon, 1000);

  // ゲートクリックでモーダル
  gate.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(gate._dest || NORMAL_DEST);
  });
})();
