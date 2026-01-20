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
    icon: "https://ul.h3z.jp/tW1CGC2i.png",
    photo: "https://ul.h3z.jp/i7T64HBV.png"
  };

  const RESET_TEST = false;
  const CRAFT_LIMIT_MS = 5 * 60 * 1000;

  /* ===============================
     ユーティリティ
  =============================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const byId = (id) => document.getElementById(id);
  const isNight = () => document.documentElement.classList.contains("is-night");

  function todayKeyJST(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  // JSTで「取得日時」表示（見やすく：YYYY/MM/DD HH:MM）
  function jstStampHM(){
    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth()+1).padStart(2,"0");
    const da = String(now.getDate()).padStart(2,"0");
    const h = String(now.getHours()).padStart(2,"0");
    const mi = String(now.getMinutes()).padStart(2,"0");
    return `${y}/${mo}/${da} ${h}:${mi}`;
  }

  function isCraftTime(){
    const now = Date.now();
    const k = "craft_start_time";
    const startRaw = localStorage.getItem(k);

    if (!startRaw){
      localStorage.setItem(k, String(now));
      return true;
    }

    const start = Number(startRaw);
    if (Number.isFinite(start) && (now - start) < CRAFT_LIMIT_MS) return true;

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
  const craftGetBtn = byId("craftGetBtn");

  const craftResult = byId("craftResult");
  const craftResultText = byId("craftResultText");

  const craftImgBtn = byId("craftImgBtn");
  const craftImgWrap = byId("craftImgWrap");

  if (!modal || !craftClaim || !craftGetBtn || !craftResult || !craftResultText) return;

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
    if (iconImg && dest.icon && iconImg.src !== dest.icon) iconImg.src = dest.icon;
  }

  /* ===============================
     モーダル制御
  =============================== */
  function resetCraftUI(dest){
    craftClaim.style.display = dest.isCraft ? "block" : "none";

    // 結果系をリセット
    craftResult.style.display = "none";
    craftResultText.textContent = "";

    // 使わないので常に非表示
    if (craftImgBtn) craftImgBtn.style.display = "none";
    if (craftImgWrap) craftImgWrap.style.display = "none";
  }

  function openModal(dest){
    if (mPhoto) mPhoto.src = dest.photo || "";
    if (mTitle) mTitle.textContent = dest.isCraft ? "職人の祭壇" : "たこ焼きゲート";

    if (mDesc){
      if (dest.isCraft){
        // ★ここ：モーダルを開いた瞬間の取得日時を表示
        mDesc.textContent =
          `今だけ5分間のレア祭壇です。\n取得しますか？\n\n取得日時：${jstStampHM()}`;
      }else{
        mDesc.textContent = "たこ焼きページへ移動しますか？";
      }
    }

    if (btnGo) btnGo.href = dest.url || "#";

    resetCraftUI(dest);

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
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
    // 取得後は入力ブロックごと消す（ボタンも消える）
    craftClaim.style.display = "none";

    craftResultText.textContent = text;
    craftResult.style.display = "block";

    if (craftImgBtn) craftImgBtn.style.display = "none";
    if (craftImgWrap) craftImgWrap.style.display = "none";
  }

  craftGetBtn.addEventListener("click", () => {
    const dest = gate._dest;
    if (!dest || !dest.isCraft) return;

    const already = getClaimedText(dest.craftId);
    if (already){
      showResult(already);
      return;
    }

    const serial = nextSerial(dest.craftId);
    const time = new Date().toLocaleString("ja-JP");

    const text =
`【職人レア枠 取得】
取得日時：${time}
取得No：${serial}

#たこ焼きトレカ #たこ焼きゲート`;

    setClaimedText(dest.craftId, text);
    showResult(text);
  });

  /* ===============================
     ★ テスト用リセット
  =============================== */
  if (RESET_TEST){
    const craftId = CRAFT_DEST.craftId;
    localStorage.removeItem(claimedKey(craftId));
    localStorage.removeItem(serialKey(craftId));
    localStorage.removeItem("craft_start_time");
  }

  /* ===============================
     初期化
  =============================== */
  applyBase();
  applyIcon();

  new MutationObserver(applyBase).observe(document.documentElement, { attributes: true });
  setInterval(applyIcon, 1000);

  gate.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(gate._dest || NORMAL_DEST);
  });
})();
