(() => {
  // ===== 設定 =====
  const isNight = () => document.documentElement.classList.contains("is-night");

  const gate = document.querySelector(".spot--gate");
  if (!gate) return;

  const baseImg = gate.querySelector(".spot__base");
  const iconImg = gate.querySelector(".spot__icon");

  // モーダル要素
  const modal  = document.getElementById("gateModal");
  const mPhoto = document.getElementById("gateModalPhoto");
  const mTitle = document.getElementById("gateModalTitle");
  const mDesc  = document.getElementById("gateModalDesc");
  const btnGo  = document.getElementById("gateModalGo");
  const btnCancel = document.getElementById("gateModalCancel");

  // ★ photo は必ず「https://」の絶対URLにするのが安全
  const DEST = [
    { hours:[0,6],   name:"すっぴん",     url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/G9HOojAP.png",  photo:"https://ul.h3z.jp/zqoEDppD.jpg" },
    { hours:[6,12],  name:"ねぎ味噌",     url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/8ipISSBp.png",  photo:"https://ul.h3z.jp/hqi2ldka.jpg" },
    { hours:[12,18], name:"めんたいマヨ", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/IShYv1or.png",  photo:"https://ul.h3z.jp/uJT6MP7r.jpg" },
    { hours:[18,21], name:"夜の店ページ", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/UHcLPRSi.png",  photo:"https://ul.h3z.jp/uJT6MP7r.jpg" },
    { hours:[21,24], name:"夜の店ページ", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/lLEWj0Pu.png",  photo:"https://ul.h3z.jp/uJT6MP7r.jpg" }
  ];

  const pickDest = (d = new Date()) => {
    const h = d.getHours();
    return DEST.find(x => h >= x.hours[0] && h < x.hours[1]) || DEST[0];
  };

  function applyBase(){
    if (!baseImg) return;
    const url = isNight() ? baseImg.dataset.night : baseImg.dataset.day;
    if (url) baseImg.src = url;
  }

  function applyIcon(){
    const dest = pickDest();
    if (iconImg && dest.icon) iconImg.src = dest.icon;
    gate._dest = dest;
  }

  function openModal(dest){
    if (!modal) {
      // モーダルが無い場合は直で飛ぶ（保険）
      window.open(dest.url, "_blank", "noopener");
      return;
    }

    if (mPhoto){
      mPhoto.src = dest.photo || "";
      mPhoto.alt = dest.name ? `たこ焼き写真：${dest.name}` : "たこ焼き写真";
    }

    if (mTitle) mTitle.textContent = "たこ焼きゲート";
    if (mDesc)  mDesc.textContent  = `この時間の行き先：${dest.name}\n行きますか？`;

    if (btnGo) btnGo.href = dest.url;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(){
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  // モーダル閉じる
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // 初期
  applyBase();
  applyIcon();

  // 昼夜切替監視（htmlのclassが変わったら土台差し替え）
  new MutationObserver((muts) => {
    for (const m of muts){
      if (m.attributeName === "class"){
        applyBase();
        break;
      }
    }
  }).observe(document.documentElement, { attributes: true });

  // 1分ごとに「時間帯」が変わったら更新
  let lastBucket = null;
  setInterval(() => {
    const d = pickDest();
    const bucket = d && d.name ? d.name : "x";
    if (bucket !== lastBucket){
      lastBucket = bucket;
      applyIcon();
    }
  }, 60 * 1000);

  // クリック：モーダル表示（ワンクッション）
  gate.addEventListener("click", (e) => {
    // buttonなので通常は不要だけど、念のため
    e.preventDefault?.();

    const dest = gate._dest || pickDest();
    openModal(dest);
  });
})();
