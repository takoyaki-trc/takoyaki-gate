(() => {
  /* ===============================
     基本取得
  =============================== */
  const gate = document.querySelector(".spot--gate");
  if (!gate) return;

  const baseImg = gate.querySelector(".spot__base");
  const iconImg = gate.querySelector(".spot__icon");

  const modal  = document.getElementById("gateModal");
  const mPhoto = document.getElementById("gateModalPhoto");
  const mTitle = document.getElementById("gateModalTitle");
  const mDesc  = document.getElementById("gateModalDesc");
  const btnGo  = document.getElementById("gateModalGo");
  const btnCancel = document.getElementById("gateModalCancel");

  const craftClaim = document.getElementById("craftClaim");
  const craftNick  = document.getElementById("craftNick");
  const craftGetBtn = document.getElementById("craftGetBtn");
  const craftResult = document.getElementById("craftResult");
  const craftResultText = document.getElementById("craftResultText");
  const craftCopyBtn = document.getElementById("craftCopyBtn");

  const isNight = () =>
    document.documentElement.classList.contains("is-night");

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
    icon: "https://ul.h3z.jp/G9HOojAP.png",
    photo: "https://ul.h3z.jp/zqoEDppD.jpg"
  };

  function isCraftTime(){
    const now = Date.now();
    let start = localStorage.getItem("craft_start_time");
    if (!start){
      start = String(now);
      localStorage.setItem("craft_start_time", start);
    }
    return now - Number(start) < 5 * 60 * 1000;
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
  function renderCraftPanel(dest){
    if (!craftClaim) return;
    craftClaim.style.display = dest.isCraft ? "block" : "none";
    if (craftResult) craftResult.style.display = "none";
    if (craftNick) craftNick.value = "";
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

    renderCraftPanel(dest);

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  if (btnCancel) btnCancel.onclick = closeModal;
  if (modal) modal.onclick = e => { if (e.target === modal) closeModal(); };

  /* ===============================
     職人取得処理（端末内）
  =============================== */
  function todayKey(){
    return new Date().toISOString().slice(0,10);
  }

  function nextSerial(id){
    const key = `craft_serial_${todayKey()}_${id}`;
    const n = (Number(localStorage.getItem(key)) || 0) + 1;
    localStorage.setItem(key, n);
    return String(n).padStart(3,"0");
  }

  if (craftGetBtn){
    craftGetBtn.onclick = () => {
      const dest = gate._dest;
      if (!dest.isCraft) return;

      const nick = craftNick.value.trim();
      if (!nick) return alert("ニックネームを入れてください");

      const serial = nextSerial(dest.craftId);
      const time = new Date().toLocaleString("ja-JP");

      const text =
`【職人レア枠 取得】
取得日時：${time}
取得No：${serial}
ニックネーム：${nick}

#たこ焼きトレカ #たこ焼きゲート`;

      craftResultText.textContent = text;
      craftResult.style.display = "block";
    };
  }

  if (craftCopyBtn){
    craftCopyBtn.onclick = () => {
      navigator.clipboard.writeText(craftResultText.textContent);
      alert("コピーしました");
    };
  }

  /* ===============================
     初期化
  =============================== */
  applyBase();
  applyIcon();

  new MutationObserver(applyBase)
    .observe(document.documentElement,{attributes:true});

  setInterval(applyIcon, 1000);

  gate.addEventListener("click", e => {
    e.preventDefault();
    openModal(gate._dest);
  });
})();
