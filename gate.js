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
  const craftNick  = byId("craftNick");
  const craftGetBtn = byId("craftGetBtn");

  const craftResult = byId("craftResult");
  const craftResultText = byId("craftResultText");

  const craftImgBtn = byId("craftImgBtn");
  const craftImgWrap = byId("craftImgWrap");
  const craftImgPreview = byId("craftImgPreview");

  /* ★追加：ニックネーム固定表示（JSだけで生成） */
  let craftNickFixed = null;

  function ensureNickFixed(){
    if (craftNickFixed) return;
    craftNickFixed = document.createElement("div");
    craftNickFixed.id = "craftNickFixed";
    craftNickFixed.style.display = "none";
    craftNickFixed.style.marginTop = "6px";
    craftNickFixed.style.padding = "10px 12px";
    craftNickFixed.style.border = "2px solid rgba(255,255,255,.85)";
    craftNickFixed.style.borderRadius = "12px";
    craftNickFixed.style.background = "rgba(0,0,0,.35)";
    craftNickFixed.style.fontSize = "13px";
    craftNickFixed.style.fontWeight = "700";
    craftClaim.prepend(craftNickFixed);
  }

  /* ===============================
     表示切替
  =============================== */
  function applyBase(){
    if (!baseImg) return;
    const url = isNight() ? baseImg.dataset.night : baseImg.dataset.day;
    if (url && baseImg.src !== url) baseImg.src = url;
  }

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
    if (!craftClaim) return;

    craftClaim.style.display = dest.isCraft ? "block" : "none";
    craftNick.value = "";
    craftNick.style.display = "block";

    if (craftNickFixed){
      craftNickFixed.style.display = "none";
      craftNickFixed.textContent = "";
    }

    craftResult.style.display = "none";
    craftResultText.textContent = "";
    craftImgWrap.style.display = "none";
    craftImgBtn.style.display = "none";
  }

  function openModal(dest){
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

    ensureNickFixed();
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
     取得処理
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

  // ▼ 入力エリア（テキストボックス＋取得ボタン）を消す
  craftClaim.style.display = "none";

  // ▼ 結果だけ表示
  craftResultText.textContent = text;
  craftResult.style.display = "block";

  // ▼ スクショ画像取得ボタンは使わないので消す
  craftImgBtn.style.display = "none";
}

  if (craftGetBtn){
    craftGetBtn.addEventListener("click", () => {
      const dest = gate._dest;
      if (!dest || !dest.isCraft) return;

      const already = getClaimedText(dest.craftId);
      if (already){
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

      /* ★ここがポイント：入力欄 → 固定表示に切替 */
      craftNick.style.display = "none";
      craftNickFixed.textContent = `ニックネーム：${nick}`;
      craftNickFixed.style.display = "block";
    });
  }

  /* ===============================
     X用画像生成
  =============================== */
  async function makeShareImage(){
    const txt = craftResultText.textContent.trim();
    if (!txt) return;

    if (typeof window.html2canvas !== "function"){
      alert("html2canvas が読み込めていません。");
      return;
    }

    const canvas = await html2canvas(craftResult, {
      backgroundColor: "#000",
      scale: 2,
      useCORS: true
    });

    craftImgPreview.src = canvas.toDataURL("image/png");
    craftImgWrap.style.display = "block";
  }

  if (craftImgBtn){
    craftImgBtn.addEventListener("click", (e) => {
      e.preventDefault();
      makeShareImage();
    });
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

