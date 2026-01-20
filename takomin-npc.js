/* takomin-npc.js */
(function(){
  const SAY_MIN = 3000;
  const SAY_MAX = 6000;

  /* ▼ 画像URL(img)とリンク(link)はここだけ差し替えればOK */
  const NPC_LIST = [
    { img:"https://ul.h3z.jp/K60wLUJA.png", link:"", lines:["ここが焼かれた伝説の入口だ。","カードを持たぬ者も、好奇心は通す。","……戻る時は、覚悟を決めてな。","焼き台の音、聞こえるか？","この村では焦った者から焼かれる。","丸い運命に抗えると思うか？","カードは拾うものじゃない、出会うものだ。","さあ、最初の一歩だ。"] },
    { img:"https://ul.h3z.jp/Ed7b954w.png", link:"", lines:["迷ったら、まず村を一周しな。","この村では“焼き”が通貨だ。","知らない建物ほど面白いぞ。","近道ほど遠回りになる。","地図より鼻を信じろ。","昼と夜で顔が変わる場所もある。","同じ道でも昨日とは違う。","一周した頃に答えが出る。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69613c64d9e9b/3.png", link:"", lines:["まだ半焼けだけど気持ちは熱々！","カードも焼き台も手加減なしっす。","失敗？それもSRだと思えば…。","焦げも経験っすよ！","回すタイミング見ててください！","次は完璧にいきますから！","練習用カード、欲しいっすか？","……今のは見なかったことに！"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69613c7b42d40/4.png", link:"", lines:["焼き色を見れば運命がわかる。","急ぐな、回せ、待て。","裏返すのは人生と同じだ。","音が変わる瞬間がある。","その一秒を逃すな。","形より芯を見ろ。","均一は幻想だ。","それでいい。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69613c9077344/5.png", link:"", lines:["朝の粉は昼の味を決める。","誰も見てない時が一番大事だ。","仕込みを笑う者は夜に泣く。","静かな時間ほど手は動く。","分量は感覚で覚えろ。","記録より記憶だ。","今日の出来は朝で決まる。","ここはまだ戦場前だ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69613ca392f90/6.png", link:"", lines:["今が一番、焼き台が騒がしい。","並ぶってことは期待されてる証だ。","列の先に伝説がある。","この時間は空気が熱い。","一舟ごとに物語がある。","待つ時間も味のうちだ。","行列は嘘をつかない。","ほら、次が来るぞ。"] },
  ];

  function pick(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  let sayTimer = null;

  function boot(){
    const imgEl   = document.getElementById("takominImg");
    const linkEl  = document.getElementById("takominLink");
    const lineEl  = document.getElementById("takominLine");
    const textEl  = document.querySelector(".takomin-text");

    // 必須DOMがないページでは何もしない（他ページで読んでも壊れない）
    if (!imgEl || !linkEl || !lineEl || !textEl) return;

    // セリフを回し続ける
    function startTalking(npc){
      if (sayTimer) clearTimeout(sayTimer);

      function sayOnce(){
        textEl.classList.add("fade-out");

        setTimeout(() => {
          lineEl.textContent = pick(npc.lines);
          textEl.classList.remove("fade-out");
          textEl.classList.add("fade-in");

          sayTimer = setTimeout(
            sayOnce,
            Math.floor(Math.random() * (SAY_MAX - SAY_MIN) + SAY_MIN)
          );
        }, 200);
      }

      // 初回
      lineEl.textContent = pick(npc.lines);
      textEl.classList.add("fade-in");

      sayTimer = setTimeout(
        sayOnce,
        Math.floor(Math.random() * (SAY_MAX - SAY_MIN) + SAY_MIN)
      );
    }

    // キャラを1人ランダム表示
    function renderRandomNPC(){
      const npc = pick(NPC_LIST);

      imgEl.src = npc.img;
      imgEl.alt = "タコ民";

      if (npc.link){
        linkEl.href = npc.link;
        linkEl.style.pointerEvents = "auto";
      } else {
        linkEl.removeAttribute("href");
        linkEl.style.pointerEvents = "none";
      }

      startTalking(npc);
    }

    renderRandomNPC();
  }

  // BASEは挿入位置が前後することがあるので、確実にDOM後に起動
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
