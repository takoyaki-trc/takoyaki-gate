(() => {
  /* =========================
     設定（必要ならここだけ変更）
  ========================= */
  const HOME_URL = "https://takoyakitrc.base.shop/"; // 「ホームページを表示する」遷移先
  const SCREENSHOT_IMAGE_URL = "https://ul.h3z.jp/t5dXbm8M.png"; // スクショ表示する画像（あなたの完成画像URLに差し替え）
  const LIMIT_ONCE_PER_DAY = false; // 1日1回制限したいなら true

  /* =========================
     要素
  ========================= */
  const gateBtn = document.querySelector(".spot--gate");
  const baseImg = gateBtn ? gateBtn.querySelector(".spot__base") : null;

  const modal  = document.getElementById("gateModal");
  const panel  = modal ? modal.querySelector(".gate-modal__panel") : null;
  const cancel = document.getElementById("gateModalCancel");

  const craftClaim = document.getElementById("craftClaim");
  const craftNick  = document.getElementById("craftNick");
  const craftGetBtn = document.getElementById("craftGetBtn");

  const craftResult = document.getElementById("craftResult");
  const craftImgWrap = document.getElementById("craftImgWrap");
  const craftImgPreview = document.getElementById("craftImgPreview");

  const craftAfterBtns = document.getElementById("craftAfterBtns");
  const craftHomeBtn = document.getElementById("craftHomeBtn");
  const craftBackBtn = document.getElementById("craftBackBtn");

  // このページに祭壇が無いなら何もしない
  if (!gateBtn || !modal || !craftClaim || !craftGetBtn) return;

  /* =========================
     JST（日付キー）
  ========================= */
  const LS_KEY = "takoyaki_ss_taken";
  const pad = (n) => String(n).padStart(2, "0");
  function jstNow() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 9 * 60 * 60000);
  }
  function jstDateKey() {
    const d = jstNow();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function alreadyTaken() {
    return localStorage.getItem(LS_KEY) === jstDateKey();
  }
  function setTaken() {
    localStorage.setItem(LS_KEY, jstDateKey());
  }

  /* =========================
     昼夜切替（spot__base の data-day / data-night を使う）
     ※既に別JSで夜切替してるなら、ここはあっても害は少ない
  ========================= */
  function isNight() {
    return document.documentElement.classList.contains("is-night");
  }
  function applyDayNight() {
    if (!baseImg) return;
    const day = baseImg.getAttribute("data-day");
    const night = baseImg.getAttribute("data-night");
    if (!day && !night) return;
    baseImg.src = isNight() ? (night || day) : (day || night);
  }
  applyDayNight();
  // たまに切り替わる実装でも追従できるよう軽く監視
  const mo = new MutationObserver(applyDayNight);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  /* =========================
     モーダル開閉
  ========================= */
  function openModal() {
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "block";

    // ★ここが大事：取得UIを表示する
    craftClaim.style.display = "block";

    // 結果は閉じておく
    if (craftResult) craftResult.style.display = "none";
    if (craftImgWrap) craftImgWrap.style.display = "none";
    if (craftAfterBtns) craftAfterBtns.style.display = "none";

    // 入力フォーカス
    if (craftNick) craftNick.focus();
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
  }

  /* =========================
     「戻る」＝取得後表示を閉じて、入力画面へ戻す
  ========================= */
  function backToInput() {
    if (craftResult) craftResult.style.display = "none";
    if (craftImgWrap) craftImgWrap.style.display = "none";
    if (craftAfterBtns) craftAfterBtns.style.display = "none";
    craftClaim.style.display = "block";
    if (craftNick) craftNick.focus();
  }

  /* =========================
     イベント：祭壇クリックでモーダル
  ========================= */
  gateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  // モーダル背景クリックで閉じる（パネル内クリックは無視）
  modal.addEventListener("click", (e) => {
    if (panel && panel.contains(e.target)) return;
    closeModal();
  });

  // やめる
  if (cancel) {
    cancel.addEventListener("click", () => closeModal());
  }

  // ESCで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "block") closeModal();
  });

  /* =========================
     取得ボタン：スクショ画像を表示する
  ========================= */
  craftGetBtn.addEventListener("click", () => {
    const name = (craftNick?.value || "").trim();

    if (!name) {
      // アラートはウザいので、入力欄にフォーカスだけ
      if (craftNick) craftNick.focus();
      return;
    }

    if (LIMIT_ONCE_PER_DAY && alreadyTaken()) {
      // うざい表示はしない（何もしない）
      return;
    }

    // 結果表示を開く
    if (craftResult) craftResult.style.display = "block";

    // スクショ画像を表示
    if (craftImgPreview) {
      craftImgPreview.src = SCREENSHOT_IMAGE_URL; // ここが「表示する画像」
      craftImgPreview.alt = `スクショ用画像（${name}）`;
    }
    if (craftImgWrap) craftImgWrap.style.display = "block";

    // 取得後ボタンを表示
    if (craftAfterBtns) craftAfterBtns.style.display = "block";

    // 1日1回制限
    if (LIMIT_ONCE_PER_DAY) setTaken();

    // 画像のところまでスクロール（迷わせない）
    if (craftImgWrap) craftImgWrap.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ホームページを表示する
  if (craftHomeBtn) {
    craftHomeBtn.addEventListener("click", () => {
      window.location.href = HOME_URL;
    });
  }

  // 戻る
  if (craftBackBtn) {
    craftBackBtn.addEventListener("click", () => {
      backToInput();
    });
  }
})();


