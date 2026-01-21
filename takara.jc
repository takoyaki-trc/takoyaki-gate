(() => {
  /* =========================
     1日1回 宝箱ガチャ + アルバム（localStorage）
     - サーバー不要
     - 端末ごとに保存
  ========================= */

  // ✅ 50種のカード（ここだけ差し替え）
  // id: 一意 / name: 表示名 / img: カード画像URL
  const CARDS = [
    // 例：
    // { id:"TN-001", name:"焼かれた伝説 001", img:"https://....png" },
    // ...
  ];

  // まだ50枚入れてない場合でも動く（ただし空だとエラーにする）
  if (!Array.isArray(CARDS) || CARDS.length === 0) {
    console.warn("CARDS が空です。カード配列を入れてください。");
    return;
  }

  // ✅ キー名（プロジェクト用に固定）
  const KEY_PREFIX = "takoyaki_chest_v1";
  const keyToday = () => {
    // 端末のローカル日付でOK（東京運用なら、端末も日本ならほぼ一致）
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };

  const KEY_CLAIMED = () => `${KEY_PREFIX}_claimed_${keyToday()}`;     // 今日引いたか
  const KEY_TODAY_CARD = () => `${KEY_PREFIX}_todaycard_${keyToday()}`; // 今日の結果（固定）
  const KEY_ALBUM = `${KEY_PREFIX}_album`;                              // これまでの履歴

  // ✅ 要素
  const chestBtn   = document.getElementById("chestBtn");
  const albumBtn   = document.getElementById("albumBtn");
  const chestModal = document.getElementById("chestModal");
  const albumModal = document.getElementById("albumModal");

  const chestClose = document.getElementById("chestClose");
  const albumClose = document.getElementById("albumClose");

  const chestCardImg  = document.getElementById("chestCardImg");
  const chestCardName = document.getElementById("chestCardName");
  const chestCardMeta = document.getElementById("chestCardMeta");
  const goAlbum       = document.getElementById("goAlbum");

  const albumGrid = document.getElementById("albumGrid");
  const albumSub  = document.getElementById("albumSub");

  if (!chestBtn || !albumBtn || !chestModal || !albumModal) return;

  // ✅ ユーティリティ
  const openModal = (el) => { el.classList.add("is-open"); el.setAttribute("aria-hidden","false"); };
  const closeModal = (el) => { el.classList.remove("is-open"); el.setAttribute("aria-hidden","true"); };

  const loadAlbum = () => {
    try{
      const raw = localStorage.getItem(KEY_ALBUM);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    }catch(e){
      return [];
    }
  };
  const saveAlbum = (arr) => localStorage.setItem(KEY_ALBUM, JSON.stringify(arr));

  const pickRandomCard = () => {
    const idx = Math.floor(Math.random() * CARDS.length);
    return CARDS[idx];
  };

  const renderResult = (card, whenLabel) => {
    chestCardImg.src = card.img;
    chestCardImg.alt = card.name;
    chestCardName.textContent = `${card.name}`;
    chestCardMeta.textContent = `${whenLabel} / ${card.id}`;
    openModal(chestModal);
  };

  const setChestVisible = (visible) => {
    chestBtn.style.display = visible ? "block" : "none";
  };

  // ✅ 今日すでに引いたか？
  const claimed = () => localStorage.getItem(KEY_CLAIMED()) === "1";

  // ✅ 初期表示：引いてたら宝箱消す
  setChestVisible(!claimed());

  // ✅ 宝箱クリック
  chestBtn.addEventListener("click", () => {
    // すでに引いてたら消す（保険）
    if (claimed()) {
      setChestVisible(false);
      // 今日の結果があるなら見せる（任意）
      const raw = localStorage.getItem(KEY_TODAY_CARD());
      if (raw) {
        try {
          const card = JSON.parse(raw);
          renderResult(card, "今日はもう開けた（結果）");
        } catch(e){}
      }
      return;
    }

    // 今日のカード確定（1回目で固定）
    const card = pickRandomCard();

    localStorage.setItem(KEY_CLAIMED(), "1");
    localStorage.setItem(KEY_TODAY_CARD(), JSON.stringify(card));

    // アルバムに追加（同じカードでも日付違いで追加）
    const album = loadAlbum();
    album.unshift({
      date: keyToday(),
      id: card.id,
      name: card.name,
      img: card.img
    });
    saveAlbum(album);

    // 宝箱を消す
    setChestVisible(false);

    // 結果表示
    renderResult(card, "今日の戦利品");
  });

  // ✅ 結果モーダル閉じる
  chestClose.addEventListener("click", () => closeModal(chestModal));
  chestModal.addEventListener("click", (e) => {
    if (e.target === chestModal) closeModal(chestModal);
  });

  // ✅ アルバム開く
  const openAlbum = () => {
    const album = loadAlbum();
    albumSub.textContent = `所持数：${album.length}（この端末のみ）`;

    albumGrid.innerHTML = "";
    if (album.length === 0) {
      albumGrid.innerHTML = `<div style="grid-column:1/-1;opacity:.85;">まだカードがありません。宝箱を開けよう！</div>`;
      openModal(albumModal);
      return;
    }

    album.forEach((it) => {
      const div = document.createElement("div");
      div.className = "album-item";
      div.innerHTML = `
        <img src="${it.img}" alt="${it.name}">
        <div class="t">${it.date}<br>${it.id}</div>
      `;
      // タップで拡大表示として結果モーダルを流用
      div.addEventListener("click", () => {
        renderResult({id: it.id, name: it.name, img: it.img}, `入手日：${it.date}`);
      });
      albumGrid.appendChild(div);
    });

    openModal(albumModal);
  };

  albumBtn.addEventListener("click", openAlbum);
  goAlbum.addEventListener("click", () => {
    closeModal(chestModal);
    openAlbum();
  });

  albumClose.addEventListener("click", () => closeModal(albumModal));
  albumModal.addEventListener("click", (e) => {
    if (e.target === albumModal) closeModal(albumModal);
  });
})();
