(() => {
  // ===== 便利：要素取得
  const $ = (sel) => document.querySelector(sel);
  const byId = (id) => document.getElementById(id);

  /* ===============================
     基本取得
  =============================== */
  const gate = $(".spot--gate");
  if (!gate) return;

  const baseImg = gate.querySelector(".spot__base");
  const iconImg = gate.querySelector(".spot__icon");

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

  const isNight = () => document.documentElement.classList.contains("is-night");

  /* ===============================
     通常ゲート
  =============================== */
  const NORMAL_DEST = {
    name: "たこ焼きゲート",
    url: "https://takoyakinana.1net.jp/",
    icon: "https://ul.h3z.jp/G9HOojAP.png",
    photo: "https://ul.h3z.jp/zqoEDppD.jpg"
  };

  /* ===============================
     職人祭壇（今から5分）
  =============================== */
  const CRAFT_DEST = {
    isCraft: true,
    craftId: "craft_now_001",
    name: "🔥 職人の祭壇 🔥",
    url: "https://takoyakinana.1net.jp/",
    icon: "https://ul.h3z.jp/lr15cpLx.png",
    photo: "https://ul.h3z.jp/38MCcDmY.png"
  };

  /* ===============================
     ★ 職人タイム（5分過ぎたら自動リセット）
  =============================== */
  function isCraftTime(){
    const now = Date.now();
    const LIMIT = 5 * 60 * 1000;

    const k = "craft_start_time";
    let start = localStorage.getItem(k);

    if (!start){
      localStorage.setItem(k, String(now));
      return true;
    }
    if (now - Number(start) < LIMIT) return true;

    localStorage.removeItem(k);
    return false;
  }

  /* ===============================
     表示切替
  =============================== */
  function applyBase(){
    if (!baseImg) return;
    const url = isNight() ? baseImg.dataset.night : baseImg.dataset.day;
    if (url) baseImg.src = url;
  }

  function applyIcon(){
    const dest = isCraftTime() ? CRAFT_DEST : NORMAL_DEST;
    gate._dest = dest;
    if (iconImg) iconImg.src = dest.icon;
  }

  /* ===============================
     モーダル
  =============================== */
  function resetCraftUI(dest){
    if (!craftClaim) return;

    craftClaim.style.display = dest.isCraft ? "block" : "none";

    if (craftNick) craftNick.value = "";

    // 結果と画像周りは毎回リセット
    if (craftResult) craftResult.style.display = "none";
    if (craftResultText) craftResultText.textContent = "";
    if (craftImgWrap) craftImgWrap.style.display = "none";
    if (craftImgBtn) craftImgBtn.style.display = "none"; // ★取得後にだけ表示
  }

  function openModal(dest){
    if (!modal) {
      window.open(dest.url, "_blank", "noopener");
      return;
    }

    if (mPhoto) mPhoto.src = dest.photo;
    if (mTitle) mTitle.textContent = dest.isCraft ? "職人の祭壇" : "たこ焼きゲート";
    if (mDesc){
      mDesc.textContent = dest.isCraft
        ? "今だけ5分間のレア祭壇です。\n取得しますか？"
        : "たこ焼きページへ移動しますか？";
    }
    if (btnGo) btnGo.href = dest.url;

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
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  /* ===============================
     取得：同端末・同日・同職人 1回
  =============================== */
  function todayKey(){
    return new Date().toISOString().slice(0,10);
  }
  function claimedKey(craftId){
    return `craft_claimed_${todayKey()}_${craftId}`;
  }
  function getClaimedText(craftId){
    return localStorage.getItem(claimedKey(craftId));
  }
  function setClaimedText(craftId, text){
    localStorage.setItem(claimedKey(craftId), text);
  }
  function nextSerial(id){
    const key = `craft_serial_${todayKey()}_${id}`;
    const n = (Number(localStorage.getItem(key)) || 0) + 1;
    localStorage.setItem(key, n);
    return String(n).padStart(3, "0");
  }

  function showResult(text){
    if (!craftResult || !craftResultText) return;

    craftResultText.textContent = text;
    craftResult.style.display = "block";

    // ★ 取得後にだけX画像ボタン表示
    if (craftImgBtn) craftImgBtn.style.display = "block";
  }

  if (craftGetBtn){
    craftGetBtn.addEventListener("click", () => {
      const dest = gate._dest;
      if (!dest || !dest.isCraft) return;

      const already = getClaimedText(dest.craftId);
      if (already){
        alert("この端末では本日すでに取得済みです（再取得はできません）");
        showResult(already);
        return;
      }

      const nick = (craftNick?.value || "").trim();
      if (!nick) return alert("ニックネームを入れてください");

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
     X用画像生成（html2canvas）
  =============================== */
  async function makeShareImage(){
    if (!craftResult || !craftResultText) return;

    const txt = craftResultText.textContent.trim();
    if (!txt){
      alert("先に『取得する』を押してね。");
      return;
    }

    if (typeof window.html2canvas !== "function"){
      alert("html2canvas が読み込めていません。scriptタグを確認してね。");
      return;
    }

    // 画像化前に表示（念のため）
    craftResult.style.display = "block";

    // 見栄え用（背景）
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

    // 戻す
    craftResult.style.backgroundColor = prevBg;
    craftResult.style.padding = prevPad;

    const dataUrl = canvas.toDataURL("image/png");

    if (craftImgPreview && craftImgWrap){
      craftImgPreview.src = dataUrl;
      craftImgWrap.style.display = "block";
    }

    alert("画像を作ったよ！画像を長押し/右クリックして保存して、Xに貼ってね。");
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

  new MutationObserver(applyBase)
    .observe(document.documentElement, { attributes:true });

  setInterval(applyIcon, 1000);

  gate.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(gate._dest);
  });
})();

