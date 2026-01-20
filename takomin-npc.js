/* takomin-npc.js */
(function(){
  const SAY_MIN = 3000;
  const SAY_MAX = 6000;

  /* ▼ 画像URL(img)とリンク(link)はここだけ差し替えればOK
     例）img:"https://basefile.akamaized.net/xxxxx/1.png"
         link:"https://takoyaki-toreka.booth.pm/items/xxxxx"
  */
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

    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696140dd11742/11.png", link:"", lines:["この村、通り過ぎるつもりだった。","気づいたら足が止まってた。","……しばらく、ここにいる。","理由？まだ言葉にできない。","何かが引っかかってる。","夜の匂いが嫌いじゃない。","出発は明日でもいい。","今日はもう少し見る。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696140ee939d8/12.png", link:"", lines:["夜はカードがよく語る。","昼には見えないものがある。","静かにしろ、今、焼かれてる。","光は少しでいい。","音を立てるな。","影が伸びる時間だ。","今は待ちだ。","……来たな。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696144bc2d0ed/13.png", link:"", lines:["一杯いくか？たこ焼きもな。","昼の話は夜に熟す。","酔ってもカードは裏切らん。","ここでは本音が出る。","火照った話ほど面白い。","飲みすぎるなよ。","最後は笑え。","また来い。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696144ccca271/14.png", link:"", lines:["焼かれるとは選ばれることだ。","丸いから転がれる。","完成とは諦めの一歩手前だ。","止まった瞬間、終わる。","不完全を愛せ。","揺れるから進める。","答えは一つじゃない。","……考えすぎるな。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696144de7dfd5/15.png", link:"", lines:["派手さより安定だ。","同じ形は二度と焼けない。","それでいい。","続けることが技だ。","余計なことはするな。","基礎を信じろ。","今日は今日の焼きだ。","黙って回せ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696144ef87599/16.png", link:"", lines:["まだ回すの遅いですか？","次は…失敗しません。","いつか名前がカードになるように。","見て覚えます。","メモは頭にあります。","焦らない、焦らない。","今日も一歩です。","いつか追いつきます。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69614505169dc/17.png", link:"", lines:["昔はカードも白黒だった。","今は…いい時代だな。","変わらない味もある。","流行は回る。","大事なものは残る。","焦げも思い出だ。","若いのは元気だ。","まぁ、悪くない。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696144a24200c/18.png", link:"", lines:["焼き時間とレア度の相関…","理論上はここだ。","実験は続く。","仮説は裏切られる。","だが、それが楽しい。","記録を取れ。","失敗もデータだ。","次は条件を変える。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/6961473c6efc8/19.png", link:"", lines:["表通りだけが村じゃない。","静かな場所ほど熱い。","……気づいたか？","足音を消せ。","光を背にするな。","ここは通好みだ。","表に出るな。","覚えておけ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/6961474dded89/20.png", link:"", lines:["今日は何か起きそうだ！","袋、開ける瞬間が一番だろ？","外れ？それも祭りだ！","音が違うぞ！","この空気、好きだ！","当たる気がする！","叫びたいな！","さぁ行こう！"] },

  
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696150d10e41a/41.png", link:"", lines:["この村の夜は静かだ。","静かすぎて怖いか？","怖いなら正しい。","正しいなら進め。","進めば景色が変わる。","変われば君も変わる。","変わった君が伝説だ。","……寝るな。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696150df7fcb0/42.png", link:"", lines:["封を切る時、音を聞け。","その音が運だ。","軽い音の日もある。","重い音の日もある。","重い日は当たりやすい。","…とか言ってみる。","信じた？","それが村だ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696150ed459d8/43.png", link:"", lines:["保存は“未来への焼き”だ。","湿気から守れ。","光からも守れ。","でも触れ。","触れないと愛が死ぬ。","愛は価値になる。","価値は物語になる。","……難しいだろ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696150fda7a06/44.png", link:"", lines:["君の推しタコ民は誰だ？","推しは増える。","増えると財布が減る。","減ると工夫が増える。","工夫が増えると楽しい。","楽しいと沼が深い。","深いと抜けない。","ようこそ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/6961510ccd25f/45.png", link:"", lines:["今日は運が悪い？","それもデータだ。","外れの山に当たりが埋まる。","当たりの山に外れが埋まる。","混ぜると世界が回る。","回ると君が回す。","回せ。","……回せ。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/6961511c4f082/46.png", link:"", lines:["君の手は温かいな。","温かい手は焼きに向く。","冷たい手は運に向く。","どっちでもいい。","結局は回数だ。","回数は裏切らない。","裏切るのは油断だ。","……油断するな。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/6961512abccca/47.png", link:"", lines:["店頭と通販、どっち派？","どっちも村の住民だ。","店頭は空気が買える。","通販は距離を焼ける。","距離が焼ければ近い。","近いなら仲間だ。","仲間なら祝え。","今日も焼け。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/696151385682e/48.png", link:"", lines:["サイン？欲しいのか。","サインは証明だ。","証明は物語だ。","物語は価値だ。","価値は未来だ。","未来は今だ。","今はここだ。","……書こうか。"] },
    { img:"https://basefile.akamaized.net/takoyakitrc-base-shop/69615147cd70a/49.png", link:"", lines:["今日のおすすめ？","迷うなら定番だ。","定番は強い。","でも変化も強い。","変化は話題だ。","話題は拡散だ。","拡散は伝説だ。","……全部食え。"] },
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
