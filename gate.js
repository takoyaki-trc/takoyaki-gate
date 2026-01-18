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

  // ▼ 画像プレビュー（HTMLが無くても自動生成して動くようにする）
  let craftImgWrap = document.getElementById("craftImgWrap");
  let craftImgPreview = document.getElementById("craftImgPreview");

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
  function ensureImageArea(){
    // craftResult の下に画像プレビューエリアを自動で作る
    if (!craftResult) return;

    if (!craftImgWrap){
      craftImgWrap = document.createElement("div");
      craftImgWrap.id = "craftImgWrap";
      craftImgWrap.style.display = "none";
      craftImgWrap.style.marginTop = "10px";

      craftImgPreview = document.createElement("img");
      craftImgPreview.id = "craftImgPreview";
      craftImgPreview.alt = "X用画像プレビュー";
      craftImgPreview.style.maxWidth = "100%";
      craftImgPreview.style.imageRendering = "pixelated";

      const note = document.createElement("div");
      note.textContent = "※画像を長押し（スマホ）/右クリック（PC）→「画像を保存」してXへ貼ってね";
      note.style.fontSize = "12px";
      note.style.opacity = "0.85";
      note.style.marginTop = "6px";

      craftImgWrap.appendChild(craftImgPreview);
      craftImgWrap.appendChild(note);

      craftResult.appendChild(craftImgWrap);
    }
  }

  function renderCraftPanel(dest){
    if (!craftClaim) return;

    craftClaim.style.display = dest.isCraft ? "block" : "none";

    if (craftResult) craftResult.style.display = "none";
    if (craftImgWrap) craftImgWrap.style.display = "none";
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
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  if (btnCancel) btnCancel.onclick = closeModal;
  if (modal) modal.onclick = e => { if (e.target === modal) closeModal(); };

  /* ===============================
     職人取得処理（端末内）
     ・同じ端末で「その日その職人は1回だけ」
  =============================== */
  function todayKey(){
    return new Date().toISOString().slice(0,10);
  }

  // ★ 取得済み保存キー（端末内）
  function claimedKey(craftId){
    return `craft_claimed_${todayKey()}_${craftId}`;
  }

  function getClaimedText(craftId){
    return localStorage.getItem(claimedKey(craftId));
  }

  function setClaimedText(craftId, text){
    localStorage.setItem(claimedKey(craftId), text);
  }

  // ★ シリアル（端末内カウント：ただし取得1回なので基本001になる）
  function nextSerial(id){
    const key = `craft_serial_${todayKey()}_${id}`;
    const n = (Number(localStorage.getItem(key)) || 0) + 1;
    localStorage.setItem(key, n);
    return String(n).padStart(3,"0");
  }

  if (craftGetBtn){
    craftGetBtn.onclick = () => {
      const dest = gate._dest;
      if (!dest || !dest.isCraft) return;

      ensureImageArea();

      // ★ すでに取得済みなら再取得禁止
      const already = getClaimedText(dest.craftId);
      if (already){
        alert("この端末では本日すでに取得済みです（再取得はできません）");
        craftResultText.textContent = already;
        craftResult.style.display = "block";
        return;
      }

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

      // ★ 取得済みとして保存（これで同端末は1回だけ）
      setClaimedText(dest.craftId, text);

      craftResultText.textContent = text;
      craftResult.style.display = "block";
    };
  }

  /* ===============================
     「コピー」→「画像を作って保存を促す」へ変更
  =============================== */
  async function makeShareImage(){
    ensureImageArea();

    if (!craftResult || !craftResultText) return;

    const txt = craftResultText.textContent.trim();
    if (!txt){
      alert("先に『取得』してテキストを出してね。");
      return;
    }

    if (typeof window.html2canvas !== "function"){
      alert("画像化ライブラリが読み込めていません。HTMLに html2canvas のscriptを追加してね。");
      return;
    }

    // 画像化したい要素：craftResult（枠込みで撮れる）
    craftResult.style.display = "block";

    // ちょい整形（見栄え用：背景が透ける場合に備える）
    const prevBg = craftResult.style.backgroundColor;
    const prevPad = craftResult.style.padding;

    craftResult.style.backgroundColor = prevBg || "#000";
    craftResult.style.padding = prevPad || "12px";

    const canvas = await html2canvas(craftResult, {
      backgroundColor: "#000",
      scale: 2
    });

    // 元に戻す
    craftResult.style.backgroundColor = prevBg;
    craftResult.style.padding = prevPad;

    const dataUrl = canvas.toDataURL("image/png");

    if (craftImgPreview && craftImgWrap){
      craftImgPreview.src = dataUrl;
      craftImgWrap.style.display = "block";
    }

    alert("X用画像を作ったよ！画像を長押し/右クリックして保存して、Xに貼ってね。");
  }

  if (craftCopyBtn){
    // ★ ボタンの役割を「画像作成」に変更
    craftCopyBtn.onclick = makeShareImage;

    // ボタン文言も変えたい場合（HTML側がbutton要素なら反映される）
    try { craftCopyBtn.textContent = "X用画像を作る"; } catch(e){}
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
