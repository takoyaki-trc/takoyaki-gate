(() => {
  /* =========================
    gate.js（完全版）
    - 通常：12種類を1時間ごと（24hで2周）
    - 追加：1日のどこかに「5分枠×5回」ランダム表示（その日は固定）
    - 優先：イベント中はイベントを上書き
  ========================= */

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

  /* =========================
    ① 通常：12種類（1時間ごと、24hで2周）
    ※ここをあなたの12種類にしてください
  ========================= */
  const DEST = [
    { name:"すっぴん",     url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/G9HOojAP.png",  photo:"https://ul.h3z.jp/zqoEDppD.jpg" },
    { name:"ねぎ味噌",     url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/8ipISSBp.png",  photo:"https://ul.h3z.jp/hqi2ldka.jpg" },
    { name:"めんたいマヨ", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/IShYv1or.png",  photo:"https://ul.h3z.jp/uJT6MP7r.jpg" },
    { name:"夜の店ページ", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/UHcLPRSi.png",  photo:"https://ul.h3z.jp/zqoEDppD.jpg" },

    // ↓残り8種類を入れて12にする（仮）
    { name:"枠05", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/G9HOojAP.png", photo:"https://ul.h3z.jp/zqoEDppD.jpg" },
    { name:"枠06", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/8ipISSBp.png", photo:"https://ul.h3z.jp/hqi2ldka.jpg" },
    { name:"枠07", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/IShYv1or.png", photo:"https://ul.h3z.jp/uJT6MP7r.jpg" },
    { name:"枠08", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/UHcLPRSi.png", photo:"https://ul.h3z.jp/zqoEDppD.jpg" },
    { name:"枠09", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/G9HOojAP.png", photo:"https://ul.h3z.jp/zqoEDppD.jpg" },
    { name:"枠10", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/8ipISSBp.png", photo:"https://ul.h3z.jp/hqi2ldka.jpg" },
    { name:"枠11", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/IShYv1or.png", photo:"https://ul.h3z.jp/uJT6MP7r.jpg" },
    { name:"枠12", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/lLEWj0Pu.png", photo:"https://ul.h3z.jp/hqi2ldka.jpg" }
  ];

  /* =========================
    ② 5分イベント：候補プール（好きに増やせる）
  ========================= */
  const EVENT_POOL = [
    { name:"5分限定①", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/G9HOojAP.png", photo:"https://ul.h3z.jp/zqoEDppD.jpg" },
    { name:"5分限定②", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/8ipISSBp.png", photo:"https://ul.h3z.jp/hqi2ldka.jpg" },
    { name:"5分限定③", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/IShYv1or.png", photo:"https://ul.h3z.jp/uJT6MP7r.jpg" },
    { name:"5分限定④", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/UHcLPRSi.png", photo:"https://ul.h3z.jp/zqoEDppD.jpg" },
    { name:"5分限定⑤", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/lLEWj0Pu.png", photo:"https://ul.h3z.jp/hqi2ldka.jpg" }
  ];

  /* =========================
    日付キー（端末日付）
    ※東京固定にしたい場合は言って（差し替え版出す）
  ========================= */
  function todayKey(){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }

  /* ====== seed付き乱数（同じ日なら同じ結果） ====== */
  function mulberry32(seed){
    return function(){
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStringToSeed(str){
    let h = 2166136261;
    for (let i=0;i<str.length;i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function pickUnique(arr, n, rnd){
    const copy = arr.slice();
    for (let i=copy.length-1;i>0;i--){
      const j = Math.floor(rnd() * (i+1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  /* ====== 5分枠を生成（1日=288スロット） ====== */
  function generateEventWindows(rnd, count=5){
    const windows = [];
    const used = new Set();
    while (windows.length < count){
      const slot = Math.floor(rnd() * 288); // 0..287
      if (used.has(slot) || used.has(slot-1) || used.has(slot+1)) continue;
      used.add(slot);
      windows.push(slot);
    }
    windows.sort((a,b)=>a-b);
    return windows.map(slot => ({ startMin: slot*5, endMin: slot*5 + 5 }));
  }

  function getTodayEventPlan(){
    const key = `gateEventPlan_${todayKey()}`;
    const saved = localStorage.getItem(key);
    if(saved){
      try { return JSON.parse(saved); } catch(e){}
    }

    const seed = hashStringToSeed("takoyaki-gate-" + todayKey());
    const rnd = mulberry32(seed);

    const picks = pickUnique(EVENT_POOL, 5, rnd);
    const windows = generateEventWindows(rnd, 5);

    const plan = windows.map((w,i)=>({
      startMin: w.startMin,
      endMin: w.endMin,
      item: picks[i] || picks[0]
    }));

    localStorage.setItem(key, JSON.stringify(plan));
    return plan;
  }

  function getActiveEventItem(){
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();
    const plan = getTodayEventPlan();
    for(const p of plan){
      if(nowMin >= p.startMin && nowMin < p.endMin) return p.item;
    }
    return null;
  }

  /* ===== 通常：12種を1時間ごと ===== */
  function getHourlyDest(){
    const hour = new Date().getHours(); // 0..23
    const idx = hour % DEST.length;     // 12なら2周
    return DEST[idx] || DEST[0];
  }

  /* ===== 最終：今表示すべき1件（イベント優先） ===== */
  function getCurrentDest(){
    const e = getActiveEventItem();
    if(e) return { ...e, isEvent:true };
    return { ...getHourlyDest(), isEvent:false };
  }

  function applyBase(){
    if(!baseImg) return;
    const url = isNight() ? baseImg.dataset.night : baseImg.dataset.day;
    if(url) baseImg.src = url;
  }

  function applyIconAndDest(){
    const dest = getCurrentDest();
    if(iconImg && dest.icon) iconImg.src = dest.icon;
    gate._dest = dest;
  }

  function openModal(dest){
    if(!modal) return;

    if(mPhoto){
      mPhoto.classList.remove("is-ready");

      const fallback = "https://ul.h3z.jp/zqoEDppD.jpg";
      const nextUrl = dest.photo || fallback;

      mPhoto.onload = () => mPhoto.classList.add("is-ready");
      mPhoto.onerror = () => {
        if(mPhoto.src !== fallback) mPhoto.src = fallback;
        mPhoto.classList.add("is-ready");
      };

      mPhoto.src = nextUrl;
      mPhoto.alt = dest.name ? `たこ焼き写真：${dest.name}` : "たこ焼き写真";
    }

    if(mTitle) mTitle.textContent = "たこ焼きゲート";
    if(mDesc){
      const label = dest.isEvent ? "【5分イベント発生中】" : "この時間の行き先";
      mDesc.textContent = `${label}：${dest.name}\n行きますか？`;
    }
    if(btnGo) btnGo.href = dest.url || "#";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(){
    if(!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  // 閉じる操作
  if(btnCancel) btnCancel.addEventListener("click", closeModal);
  if(modal) modal.addEventListener("click", (e) => { if(e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeModal(); });

  // 初期表示
  applyBase();
  applyIconAndDest();

  // 昼夜切替監視
  new MutationObserver(muts => {
    for(const m of muts){
      if(m.attributeName === "class"){
        applyBase();
        break;
      }
    }
  }).observe(document.documentElement, { attributes: true });

  // ✅ 30秒ごとに更新（5分イベント追従）
  setInterval(applyIconAndDest, 30 * 1000);

  // クリック：モーダル
  gate.addEventListener("click", () => {
    const dest = gate._dest || getCurrentDest();
    openModal(dest);
  });
})();
