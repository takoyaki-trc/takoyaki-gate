<script>
(() => {
  /* =========================
     ✅ 1日1回 宝箱ガチャ + 端末アルバム（localStorage）
     ✅ アルバム入口：タコ民NPC
  ========================= */

  // =========================
  // ✅ 50枚カードをここに入れる
  // id: 一意 / name: 表示名 / img: 画像URL
  // =========================
  const CARDS = [
    // 例：
    // { id:"TN-001", name:"焼かれた伝説 001", img:"https://ul.h3z.jp/xxxx.png" },
  ];

  if (!Array.isArray(CARDS) || CARDS.length === 0) {
    console.warn("CARDS が空です。カード50枚を入れてください。");
    return;
  }

  // ✅ キー名（プロジェクト用に固定）
  const KEY_PREFIX = "takoyaki_chest_v1";

  // ✅ 今日キー（端末のローカル日付）
  const keyToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };

  const KEY_CLAIMED    = () => `${KEY_PREFIX}_claimed_${keyToday()}`;      // 今日引いたか
  const KEY_TODAY_CARD = () => `${KEY_PREFIX}_todaycard_${keyToday()}`;    // 今日のカード（固定）
  const KEY_ALBUM      = `${KEY_PREFIX}_album`;                             // これまでの履歴

  // ✅ 要素
  const chestBtn   = document.getElementById("chestBtn");
  const chestModal = document.getElementById("chestModal");
  const albumModal = document.getElementById("albumModal");

  const chestClose = document.getElementById("chestClose");
  const albumClose = document.getElementById("albumClose");

  const chestCardImg  = document.getElementById("chestCardImg");
  const chestCardName = document.getElementById("chestCardName");
  const chestCardMeta = document.getElementById("chestCardMeta");
  const goAlbum       = document.getElementById("goAlbum");

  const albumNpc = document.getElementById("albumNpc");
  const albumNpcBalloon = document.getElementById("albumNpcBalloon");

  const albumGrid = document.getElementById("albumGrid");
  const albumSub  = document.getElementById("albumSub");
  const albumClear= document.getElementById("albumClear");

  if (!chestBtn || !chestModal || !albumModal || !albumNpc) return;

  // ✅ モーダル操作
  const openModal = (el) => { el.classList.add("is-open"); el.setAttribute("aria-hidden","false"); };
  const closeModal = (el) => { el.classList.remove("is-open"); el.setAttribute("aria-hidden","true"); };

  // ✅ アルバム読み書き
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

  // ✅ 乱数1枚
  const pickRandomCard = () => CARDS[Math.floor(Math.random() * CARDS.length)];

  // ✅ 今日引いた？
  const claimed = () => localStorage.getItem(KEY_CLAIMED()) === "1";

  // ✅ 宝箱表示制御（引いたら消す）
  const setChestVisible = (visible) => {
    chestBtn.style.display = visible ? "block" : "none";
  };

  // ✅ 結果表示
  const renderResult = (card, label) => {
    chestCardImg.src = card.img;
    chestCardImg.alt = card.name;
    chestCardName.textContent = card.name;
    chestCardMeta.textContent = `${label} / ${card.id}`;
    openModal(chestModal);
  };

  // ✅ 初期：引いてたら宝箱消す
  setChestVisible(!claimed());

  // ✅ タコ民吹き出し：所持数を反映（ついで）
  const refreshNpcBalloon = () => {
    const album = loadAlbum();
    const n = album.length;
    if (albumNpcBalloon){
      albumNpcBalloon.textContent = n === 0
        ? "アルバム見る？\n（まだ0枚）"
        : `アルバム見る？\n（${n}枚）`;
    }
  };
  refreshNpcBalloon();

  // ✅ 宝箱クリック（1日1回）
  chestBtn.addEventListener("click", () => {
    // すでに引いてたら宝箱は消す（保険）
    if (claimed()) {
      setChestVisible(false);
      const raw = localStorage.getItem(KEY_TODAY_CARD());
      if (raw) {
        try { renderResult(JSON.parse(raw), "今日はもう開けた（結果）"); } catch(e){}
      }
      return;
    }

    // 今日のカード確定（1回目で固定）
    const card = pickRandomCard();

    localStorage.setItem(KEY_CLAIMED(), "1");
    localStorage.setItem(KEY_TODAY_CARD(), JSON.stringify(card));

    // アルバムに追加（引いた順）
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

    // 吹き出し更新
    refreshNpcBalloon();

    // 結果表示
    renderResult(card, "今日の戦利品");
  });

  // ✅ 結果モーダル閉じる
  chestClose.addEventListener("click", () => closeModal(chestModal));
  chestModal.addEventListener("click", (e) => {
    if (e.target === chestModal) closeModal(chestModal);
  });

  // ✅ アルバム表示
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
      // タップで拡大（宝箱結果モーダルを流用）
      div.addEventListener("click", () => {
        renderResult({id: it.id, name: it.name, img: it.img}, `入手日：${it.date}`);
      });
      albumGrid.appendChild(div);
    });

    openModal(albumModal);
  };

  // ✅ タコ民をタップ → アルバムを開く
  albumNpc.addEventListener("click", openAlbum);

  // ✅ 「アルバムで見る」ボタン（結果画面から）
  goAlbum.addEventListener("click", () => {
    closeModal(chestModal);
    openAlbum();
  });

  // ✅ アルバム閉じる
  albumClose.addEventListener("click", () => closeModal(albumModal));
  albumModal.addEventListener("click", (e) => {
    if (e.target === albumModal) closeModal(albumModal);
  });

  // ✅ アルバム初期化（任意）
  albumClear.addEventListener("click", () => {
    if (!confirm("この端末のアルバムを初期化します。よろしいですか？")) return;
    localStorage.removeItem(KEY_ALBUM);
    refreshNpcBalloon();
    // 表示更新
    albumGrid.innerHTML = `<div style="grid-column:1/-1;opacity:.85;">初期化しました。宝箱を開けよう！</div>`;
    albumSub.textContent = `所持数：0（この端末のみ）`;
  });
})();
</script>
