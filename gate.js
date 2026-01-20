(() => {
  const isNight = () => document.documentElement.classList.contains("is-night");

  const gate = document.querySelector(".spot--gate");
  if(!gate) return;

  const baseImg = gate.querySelector(".spot__base");
  const iconImg = gate.querySelector(".spot__icon");

  // ✅ モーダル要素
  const modal  = document.getElementById("gateModal");
  const mPhoto = document.getElementById("gateModalPhoto");
  const mTitle = document.getElementById("gateModalTitle");
  const mDesc  = document.getElementById("gateModalDesc");
  const btnGo  = document.getElementById("gateModalGo");
  const btnCancel = document.getElementById("gateModalCancel");

  // ✅ 時間帯ごとに「行き先URL」と「上乗せアイコン」と「モーダルに出す写真」
  const DEST = [
    { hours:[0,6],   name:"すっぴん",     url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/G9HOojAP.png",  photo:"https://ul.h3z.jp/zqoEDppD.jpg" },
    { hours:[6,12],  name:"ねぎ味噌",     url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/8ipISSBp.png",  photo:"https://ul.h3z.jp/hqi2ldka.jpg" },
    { hours:[12,18], name:"めんたいマヨ", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/IShYv1or.png",  photo:"https://ul.h3z.jp/uJT6MP7r.jpg" },
    { hours:[18,21], name:"夜の店ページ", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/UHcLPRSi.png",  photo:"real_04.jpg" },
    { hours:[21,24], name:"夜の店ページ", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/lLEWj0Pu.png",  photo:"real_05.jpg" }
  ];

  const pickDest = (d = new Date()) => {
    const h = d.getHours();
    return DEST.find(x => h >= x.hours[0] && h < x.hours[1]) || DEST[0];
  };

  function applyBase(){
    if(!baseImg) return;
    const url = isNight() ? baseImg.dataset.night : baseImg.dataset.day;
    if(url) baseImg.src = url;
  }

  function applyIcon(){
    const dest = pickDest();
    if(iconImg && dest.icon) iconImg.src = dest.icon;
    gate._dest = dest; // 現在の行き先を保持
  }

  function openModal(dest){
    if(!modal) return;

    if(mPhoto){
      mPhoto.src = dest.photo || "";
      mPhoto.alt = dest.name ? `たこ焼き写真：${dest.name}` : "たこ焼き写真";
    }

    if(mTitle) mTitle.textContent = "たこ焼きゲート";
    if(mDesc)  mDesc.textContent  = `この時間の行き先：${dest.name}\n行きますか？`;

    if(btnGo) btnGo.href = dest.url;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(){
    if(!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  // モーダル閉じる操作
  if(btnCancel) btnCancel.addEventListener("click", closeModal);
  if(modal) modal.addEventListener("click", (e) => { if(e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeModal(); });

  // 初期表示
  applyBase();
  applyIcon();

  // 昼夜切替を監視して土台画像を更新
  new MutationObserver(muts => {
    for(const m of muts){
      if(m.attributeName === "class"){
        applyBase();
        break;
      }
    }
  }).observe(document.documentElement, { attributes: true });

  // 1分ごとに「時間が変わったら」上乗せアイコン更新
  let lastHour = new Date().getHours();
  setInterval(() => {
    const h = new Date().getHours();
    if(h !== lastHour){
      lastHour = h;
      applyIcon();
    }
  }, 60 * 1000);

  // ✅ クリック：直飛びではなく “ワンクッション（モーダル）” を出す
  gate.addEventListener("click", () => {
    const dest = gate._dest || pickDest();
    openModal(dest);
  });
})();

