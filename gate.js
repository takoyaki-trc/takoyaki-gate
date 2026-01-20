(() => {
  /* =========================
     設定（必要ならここだけ変更）
  ========================= */
  const HOME_URL = "https://takoyakitrc.base.shop/";
  const SCREENSHOT_IMAGE_URL = "https://ul.h3z.jp/t5dXbm8M.png";
  const LIMIT_ONCE_PER_DAY = false; // trueで1日1回
  const KEEP_NICK_ON_BACK = true;   // 戻るでニックネーム残す

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
     昼夜切替（data-day / data-night）
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
  const mo = new MutationObserver(applyDayNight);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  /* =========================
     表示ユーティリティ
  ========================= */
  function resetResultUI() {
    if (craftResult) craftResult.style.display = "none";
    if (craftImgWrap) craftImgWrap.style.display = "none";
    if (craftAfterBtns) craftAfterBtns.style.display = "none";
    if (craftImgPreview) {
      craftImgPreview.removeAttribute("src");
      craftImgPreview.alt = "スクショ用画像";
    }
  }

  function openModal() {
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "block";

    craftClaim.style.display = "block";
    resetResultUI();

    if (craftNick) craftNick.focus();
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
  }

  function backToInput() {
    resetResultUI();
    craftClaim.style.display = "block";
    if (!KEEP_NICK_ON_BACK && craftNick) craftNick.value = "";
    if (craftNick) craftNick.focus();
  }

  function isModalOpen() {
    return modal.getAttribute("aria-hidden") === "false";
  }

  /* =========================
     イベント
  ========================= */
  gateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  // 背景クリックで閉じる
  modal.addEventListener("click", (e) => {
    if (panel && panel.contains(e.target)) return;
    closeModal();
  });

  // やめる
  if (cancel) cancel.addEventListener("click", closeModal);

  // ESCで閉じる（判定を安全に）
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isModalOpen()) closeModal();
  });

  // 取得ボタン
  craftGetBtn.addEventListener("click", () => {
    const name = (craftNick?.value || "").trim();
    if (!name) {
      if (craftNick) craftNick.focus();
      return;
    }

    if (LIMIT_ONCE_PER_DAY && alreadyTaken()) return;

    if (craftResult) craftResult.style.display = "block";

    if (craftImgPreview) {
      craftImgPreview.src = SCREENSHOT_IMAGE_URL;
      craftImgPreview.alt = `スクショ用画像（${name}）`;
    }
    if (craftImgWrap) craftImgWrap.style.display = "block";
    if (craftAfterBtns) craftAfterBtns.style.display = "block";

    if (LIMIT_ONCE_PER_DAY) setTaken();

    if (craftImgWrap) craftImgWrap.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ホーム
  if (craftHomeBtn) craftHomeBtn.addEventListener("click", () => {
    window.location.href = HOME_URL;
  });

  // 戻る
  if (craftBackBtn) craftBackBtn.addEventListener("click", backToInput);
})();

