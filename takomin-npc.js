/* takomin-npc.js */
(function(){
  const SAY_MIN = 3000;
  const SAY_MAX = 6000;

  const NPC_LIST = [
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/6961385207fa3/1.png", link:"", lines:["ここが焼かれた伝説の入口だ。","カードを持たぬ者も、好奇心は通す。","……戻る時は、覚悟を決めてな。","焼き台の音、聞こえるか？","この村では焦った者から焼かれる。","丸い運命に抗えると思うか？","カードは拾うものじゃない、出会うものだ。","さあ、最初の一歩だ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/6961386393199/2.png", link:"", lines:["迷ったら、まず村を一周しな。","この村では“焼き”が通貨だ。","知らない建物ほど面白いぞ。","近道ほど遠回りになる。","地図より鼻を信じろ。","昼と夜で顔が変わる場所もある。","同じ道でも昨日とは違う。","一周した頃に答えが出る。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69613c64d9e9b/3.png", link:"", lines:["まだ半焼けだけど気持ちは熱々！","カードも焼き台も手加減なしっす。","失敗？それもSRだと思えば…。","焦げも経験っすよ！","回すタイミング見ててください！","次は完璧にいきますから！","練習用カード、欲しいっすか？","……今のは見なかったことに！"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69613c7b42d40/4.png", link:"", lines:["焼き色を見れば運命がわかる。","急ぐな、回せ、待て。","裏返すのは人生と同じだ。","音が変わる瞬間がある。","その一秒を逃すな。","形より芯を見ろ。","均一は幻想だ。","それでいい。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69613c9077344/5.png", link:"", lines:["朝の粉は昼の味を決める。","誰も見てない時が一番大事だ。","仕込みを笑う者は夜に泣く。","静かな時間ほど手は動く。","分量は感覚で覚えろ。","記録より記憶だ。","今日の出来は朝で決まる。","ここはまだ戦場前だ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69613ca392f90/6.png", link:"", lines:["今が一番、焼き台が騒がしい。","並ぶってことは期待されてる証だ。","列の先に伝説がある。","この時間は空気が熱い。","一舟ごとに物語がある。","待つ時間も味のうちだ。","行列は嘘をつかない。","ほら、次が来るぞ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69613cb35b5cb/7.png", link:"", lines:["カードか？見るだけならタダだ。","今日の相場は…熱いぞ。","迷ってる時間もコストだ。","一期一会って言葉、知ってるか？","欲しい時が買い時だ。","売り切れは実力だ。","後悔は高くつく。","……決めたか？"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696140a0e8dcf/8.png", link:"", lines:["ダブり？それは希望だ。","この角、印刷…最高だろ。","完成はまだ先でいい。","同じカードでも同じ顔はない。","触った感触、覚えておけ。","集めるほど終わらなくなる。","完成したら少し寂しいぞ。","だから続けるんだ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696140b3062bb/9.png", link:"", lines:["聞いたか？昨夜URが焼かれたらしい。","あの建物、昼と夜で顔が違う。","信じるかどうかは君次第だ。","噂は半分で聞け。","残り半分は自分で確かめろ。","夜は情報が軽くなる。","静かな話ほど本当だ。","……今のは内緒だ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696140c93b6fe/10.png", link:"", lines:["ねぇねぇ！次はどれ焼くの？","このカード、キラキラしてる！","大人になるまで集めるんだ！","これレア？ねえレア？","友だちに自慢するんだ！","一緒に並ぼ！","全部ほしいなぁ。","将来、全部覚えてるからね！"] },
    /* ……中略：11〜49もそのまま入れてOK…… */
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696151578a8ac/50.png", link:"", lines:["ここまで来たなら、もう終わりだ。","終わりってのは始まりだ。","始まりは一枚だ。","一枚は一舟だ。","一舟は一歩だ。","一歩は一周だ。","一周したらまた来る。","……また会おう。"] }
  ];

  function pick(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  let sayTimer = null;

  function boot(){
    const imgEl  = document.getElementById("takominImg");
    const linkEl = document.getElementById("takominLink");
    const lineEl = document.getElementById("takominLine");
    const textEl = document.querySelector(".takomin-text");

    if (!imgEl || !linkEl || !lineEl || !textEl) return;

    function animateSwap(nextText){
      textEl.classList.remove("fade-in");
      textEl.classList.add("fade-out");

      setTimeout(() => {
        lineEl.textContent = nextText;

        textEl.classList.remove("fade-out");
        textEl.classList.remove("fade-in");
        void textEl.offsetWidth; // reflow
        textEl.classList.add("fade-in");
      }, 200);
    }

    function startTalking(npc){
      if (sayTimer) clearTimeout(sayTimer);

      textEl.classList.remove("fade-out");
      textEl.classList.remove("fade-in");
      lineEl.textContent = pick(npc.lines);
      void textEl.offsetWidth;
      textEl.classList.add("fade-in");

      function sayOnce(){
        animateSwap(pick(npc.lines));
        sayTimer = setTimeout(
          sayOnce,
          Math.floor(Math.random() * (SAY_MAX - SAY_MIN) + SAY_MIN)
        );
      }

      sayTimer = setTimeout(
        sayOnce,
        Math.floor(Math.random() * (SAY_MAX - SAY_MIN) + SAY_MIN)
      );
    }

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once:true });
  } else {
    boot();
  }
})();
