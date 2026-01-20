(() => {
  "use strict";

  const $ = (sel, root=document) => root.querySelector(sel);
  const byId = (id) => document.getElementById(id);

  const gate = $(".spot--gate");
  if (!gate) return;

  const modal  = byId("gateModal");
  const panel  = modal ? modal.querySelector(".gate-modal__panel") : null;
  const mPhoto = byId("gateModalPhoto");
  const mTitle = byId("gateModalTitle");
  const mDesc  = byId("gateModalDesc");
  const btnCancel = byId("gateModalCancel");
  const btnGo  = byId("gateModalGo");

  const craftClaim = byId("craftClaim");
  const craftResult = byId("craftResult");
  const craftResultText = byId("craftResultText");

  if (!modal || !mTitle || !mDesc || !craftResult || !craftResultText) return;

  function openModal(){
    // モーダル表示
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // 表示文（取得しますか？は無し）
    mTitle.textContent = "職人の祭壇";
    mDesc.textContent = "今だけ5分間のレア祭壇です。";

    // 「行く」は残っててもOK（CSSで非表示の想定）
    if (btnGo) btnGo.href = "#";

    // いったん結果は消す
    if (craftClaim) craftClaim.style.display = "none";
    craftResult.style.display = "none";
    craftResultText.textContent = "";
  }

  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  // 祭壇クリック
  gate.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  // 戻る
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  // 背景クリックで閉じる（パネル内は無視）
  modal.addEventListener("click", (e) => {
    if (panel && panel.contains(e.target)) return;
    closeModal();
  });

})();

