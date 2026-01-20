/* ===== たこ焼きゲート JS（完全版） ===== */
(() => {
  const gate = document.querySelector(".spot--gate");
  if(!gate) return;

  const base  = gate.querySelector(".spot__base");
  const icon  = gate.querySelector(".spot__icon");

  const modal = document.getElementById("gateModal");
  const photo = document.getElementById("gateModalPhoto");
  const desc  = document.getElementById("gateModalDesc");
  const btnGo = document.getElementById("gateModalGo");
  const btnCancel = document.getElementById("gateModalCancel");

  const DEST = [
    { h:[0,6],   name:"すっぴん",     url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/G9HOojAP.png", photo:"https://ul.h3z.jp/zqoEDppD.jpg" },
    { h:[6,12],  name:"ねぎ味噌",     url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/8ipISSBp.png", photo:"https://ul.h3z.jp/hqi2ldka.jpg" },
    { h:[12,18], name:"めんたいマヨ", url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/IShYv1or.png", photo:"https://ul.h3z.jp/uJT6MP7r.jpg" },
    { h:[18,24], name:"夜の店",       url:"https://takoyakinana.1net.jp/", icon:"https://ul.h3z.jp/UHcLPRSi.png", photo:"https://ul.h3z.jp/zqoEDppD.jpg" }
  ];

  const pick = () => {
    const h = new Date().getHours();
    return DEST.find(d => h >= d.h[0] && h < d.h[1]) || DEST[0];
  };

  const apply = () => {
    const d = pick();
    icon.src = d.icon;
    gate._dest = d;
  };

  gate.addEventListener("click", () => {
    const d = gate._dest || pick();
    photo.src = d.photo;
    desc.textContent = `この時間の行き先：${d.name}\n行きますか？`;
    btnGo.href = d.url;
    modal.classList.add("is-open");
  });

  btnCancel.addEventListener("click", () => {
    modal.classList.remove("is-open");
  });

  modal.addEventListener("click", e => {
    if(e.target === modal){
      modal.classList.remove("is-open");
    }
  });

  apply();
})();
