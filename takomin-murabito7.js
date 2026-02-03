(function(){
  const isNight = () =>
    document.documentElement.classList.contains("is-night") ||
    document.body.classList.contains("is-night");

  const TALK = {

    me1: { // 昼：バイク便のたこ焼き配達の男 / 夜：ゴースト
      day: [
        "よっ！\nたこ焼き便、\n到着だ！\n新しい情報、\n積んでるぜ。",
        "噂も速報も、\n今が一番\n焼きたてだ。\n逃すなよ。",
        "ピンポーン。\n受け取りサイン、\n心で頼む。",
        "今日の荷物は\n軽い。\nでも中身は\n重い。",
        "遅れた？\n違う。\nお前が\n早すぎたんだ。"
      ],
      night: [
        "……昼の便は\nもう来ない。\nでも情報は\n残ってる。",
        "気づいた人だけが\n読んでる。\n音はもう、\n聞こえない。",
        "封を切った瞬間、\n逃げ場は\nなくなる。",
        "これ、\n本当は\n出しちゃ\nいけない話。",
        "……誰にも\n言うな。\nもう遅いけど。"
      ],
      vanishLine: "……次に見る時、\n同じ姿とは\n限らない。"
    },

    me2: { // 昼：メイドさん / 夜：コウモリ
      day: [
        "ようこそ。\nこちらは\nたこ焼きトレカの世界で\nございます。",
        "ご案内が\n必要でしたら、\nまずはこちらを\nお読みくださいませ。",
        "迷子の方にも、\n慣れた方にも、\n設定をどうぞ。",
        "世界観の説明、\n紅茶より先に\nお持ちしますね。",
        "ページを開いた時点で、\nチェックイン完了です。"
      ],
      night: [
        "……夜になると\n世界は\n裏返る。",
        "設定は\n読むものじゃない。\n染み込むものだ。",
        "気づいたら\n現実より\nこっちが\n重くなる。",
        "戻れなくなった人、\n何人も\n見てきた。",
        "……羽音が\n聞こえた？"
      ],
      vanishLine: "……ページを閉じても、\n設定は\n頭に残る。"
    },

    me3: { // 昼：サラリーマン / 夜：アザラシ
      day: [
        "お困りですか？\n基本的な答えは\nここに\nまとまっています。",
        "確認しておくと、\n後で\n無駄が\n減りますよ。",
        "FAQ確認は\n社会人の\n基本動作です。",
        "想定内の質問には\n回答があります。\n想定外は…\n各自対応で。",
        "読むだけで\n工数削減。\nおすすめです。"
      ],
      night: [
        "……質問ってさ。\n答えを知ると\n増えるんだ。",
        "読むほど\n安心できる。\nでも眠れなくなる。",
        "書いてあることより、\n書いてないことが\n多い。",
        "答えは\n正しいとは\n限らない。",
        "……それでも\n読むんだね。"
      ],
      vanishLine: "……答えは出た。\nでも安心は\nしないで。"
    },

    me4: { // 昼：ナース / 夜：蛇女
      day: [
        "今遊べるイベントは\nこちらですよ。\n本日の分、\nお忘れなく。",
        "期間限定です。\n体調と同じで、\n“今”が\n大切です。",
        "本日の処方：\nイベント1回。\n副作用あり。",
        "無理は禁物。\nでも\n取り逃しは\nもっと禁物。",
        "異常を感じたら\nすぐ再訪を。"
      ],
      night: [
        "……夜は\n隠し事が\n増える時間。",
        "気づいた人だけが\n参加できる。",
        "知らないまま\n終わる人が\nほとんど。",
        "終わってから\n知っても、\n遅いの。",
        "……巻き付かれたら\n離れられないわよ。"
      ],
      vanishLine: "……終わったイベントは\n戻らない。\n跡だけ残る。"
    },

    me5: { // 昼：剣士 / 夜：のっぺらぼう
      day: [
        "ここが\nビンゴの泉だ。\n揃えた者だけが\n次へ進める。",
        "あと一歩の\n緊張感こそ、\n勝負の\n醍醐味だ。",
        "あと一枚…\nこの距離が\n最も長い。",
        "揃わぬなら\n待て。\n待つのも\n剣だ。",
        "泉よ。\n我に\n新規を。"
      ],
      night: [
        "……泉を\n覗いたね。",
        "顔は映らない。\n数字だけが\n浮かぶ。",
        "揃わない音が\nずっと\n聞こえる。",
        "空白が\nこちらを\n見ている。",
        "……誰の番だった？"
      ],
      vanishLine: "……泉を覗いたね。\n次は、\n覗き返される番。"
    },

    me6: { // 昼：聖女 / 夜：猫女
      day: [
        "カードを\nお求めでしたら、\nこちらへ。",
        "一つの選択が、\n運命を\n導きます。",
        "迷いは\n祈りで\nほどけます。",
        "引き当てた瞬間、\n祝福は\n降ります。",
        "開封前の沈黙。\nそれも\n尊い時間です。"
      ],
      night: [
        "……夜に買うと\n引きが\n歪む。",
        "欲しかったカードと\n違うものが\n来る。",
        "でもね、\nそれが一番\n記憶に残る。",
        "後悔と満足、\n区別つく？",
        "……箱、\n開ける？"
      ],
      vanishLine: "……レシートは残る。\nでも理由は\n消える。"
    },

    me7: { // 昼：王様 / 夜：提灯おばけ
      day: [
        "ここに集うは\nたこぴの\n言葉たちじゃ。",
        "見て、\n笑い、\n広めよ。\n民の力なり。",
        "よいか。\n拡散は\n命令ではない。\nだが強い。",
        "笑った者は\n臣下。\n刺さった者は\n側近。",
        "王命である。\n一度は\n覗いていけ。"
      ],
      night: [
        "……夜の投稿は\n灯りが\n弱い。",
        "でもね、\n遠くまで\n届く。",
        "刺さる人にだけ\n刺さる。",
        "気づいた時には\nもう\n遅い。",
        "……誰かが\n見てるよ。"
      ],
      vanishLine: "……見たね。\nじゃあ\n“見られる側”に\n回って。"
    },

    me8: { // 昼：漁師 / 夜：傘おばけ
      day: [
        "アイテムなら\nここだな。",
        "道具一つで、\n旅の\n漁場は\n変わる。",
        "今日は\n良い引きが\n来そうだ。",
        "深いとこほど\nいい物が\n沈んでる。",
        "網は破れても\n運は拾える。"
      ],
      night: [
        "……夜の店は\n勝手に\n開く。",
        "買った覚えのない\n物が\n増える。",
        "使い道は\n後で\nわかる。",
        "捨てても\n戻ってくる。",
        "……濡れてない？"
      ],
      vanishLine: "……閉店。\nでも棚は\n片付けない。"
    },

    me9: { // 昼：踊り子 / 夜：一反木綿
      day: [
        "ここは\n達成の記録。",
        "足跡は\nちゃんと\n残ってる。",
        "増えた分だけ\nステップが\n軽くなる。",
        "止まった日も\nリズムの\n一部よ。",
        "記録は\n踊るみたいに\n積み上がる。"
      ],
      night: [
        "……夜に見ると\n記録が\n重い。",
        "やってない日が\n浮き上がる。",
        "忘れた数字が\n絡みつく。",
        "剥がしても\n残る。",
        "……巻かれる？"
      ],
      vanishLine: "……記録は消えない。\n忘れても\n残る。"
    },

    me10: { // 昼：猫人間（女） / 夜：ナーガ
      day: [
        "メディア掲載は\nここだよ。",
        "たくさん\n見られるほど、\n物語は\n大きくなるにゃ。",
        "褒められると\n伸びるタイプにゃ。",
        "話題は\n追うと逃げる。\n撫でると寄るにゃ。",
        "今日は\n爪は立てない。\nたぶんにゃ。"
      ],
      night: [
        "……夜に読むと\n記事は\n予言になる。",
        "広まった瞬間、\n制御できない。",
        "善意も\n混ざる。",
        "悪意も\n混ざる。",
        "……巻き戻せない。"
      ],
      vanishLine: "……話題は消える。\nでも噂だけは\n残る。"
    },

    me11: { // 昼：旅芸人 / 夜：ベロ出しお化け
      day: [
        "さあさあ、\n寄ってらっしゃい。",
        "軽く見たら\n後で\n気になるよ。",
        "笑ってるうちに\n一つ\n覚える。",
        "深刻そうで\n深刻じゃない。\nたぶん。",
        "余興のつもりで\nどうだい？"
      ],
      night: [
        "……夜は\n舌が\n長くなる。",
        "言わなくていいことが\n出てくる。",
        "聞いたら\n忘れられない。",
        "味は\n悪くない。",
        "……なめてみる？"
      ],
      vanishLine: "……出したものは\n引っ込まない。"
    },

    me12: { // 昼：侍（武士） / 夜：影男
      day: [
        "ここが\nカード図鑑で\nござる。",
        "集めた分だけ、\n世界の\n輪郭が\n見える。",
        "未所持の空白、\n無念。\nされど\n修行。",
        "収集とは\n鍛錬。",
        "欲なくして\n極みなし。"
      ],
      night: [
        "……夜の図鑑は\n勝手に\n開く。",
        "空白が\nこちらを\n見ている。",
        "持ってないカードの\n影が\n伸びる。",
        "集めても\n足りない。",
        "……影は\n減らない。"
      ],
      vanishLine: "……図鑑を閉じても、\n影は\n残る。"
    },

    me13: { // たこ焼き祭壇：複数タコ民
      day: [
        "もりあがってるぜ～\n今日は、\nどのたこ焼きに\nなる？",
        "鉄板が\n熱くなってきた!!\nこれは\n当たりの日だ！",
        "ソース？\nマヨ？\nいやいや、\n主役は\n俺たちだろ！",
        "並んでるな～\n見られてるな～\n人気者は\nつらいぜ！",
        "回される前が\n一番\nワクワク\nするんだよな！"
      ],
      night: [
        "……あつっ",
        "ちょ、\nまだ心の\n準備が――",
        "ひっくり返すな!!\n……あ、\n返された。",
        "焼けてきた。\n形が\n丸く\nなっていく……",
        "……ああ、\nなるほど。\nこれが\n役目か。"
      ],
      vanishLine: "時はきた。\n僕らも\nたこ焼きになる･･･"
    },

    ghost: {
      day: [
        "いらっしゃい。\nGHOSTよ。\n昼は、\n落ち着いてるの。",
        "焦らなくていいわ。\nダーツは、\n待ってくれる。",
        "その構え……\n悪くないわね。",
        "一本目は様子見。\n二本目で、\n気持ちが出るわ。",
        "……ふふ。\nちゃんと、\n届いてる。"
      ],
      night: [
        "夜のGHOSTよ。\nちょっとだけ、\nタコ民っぽい。",
        "この時間はね、\n音が\n丸く聞こえるの。",
        "外しても、\n怒らない。\n夜だから。",
        "盤も、\n眠そうね。",
        "……今日は、\nここまでにしましょ。"
      ],
      vanishLine: "……また静かな時間に、\n来なさい。"
    },

    yousha: {
      day: [
        "YOUSHAだ。\n普通に投げれば、\n普通に刺さる。",
        "盤は、\n今日も丸い。",
        "狙った場所と、\n刺さる場所。\nだいたい違う。",
        "それでいい。",
        "……問題ない。"
      ],
      night: [
        "夜のYOUSHAだ。\n盤が、\n少し近い。",
        "音が、\n昼より\n気になるな。",
        "外れたけど、\n悪くない。",
        "夜は、\n結果より\n感触だ。",
        "……そろそろ帰れ。"
      ],
      vanishLine: "……見られてた、\n気がするな。"
    },

    motoyu: {
      day: [
        "いらっしゃい！\nここは北海道のたこ焼き菜々だよ！\n今日もいい湯、沸いてる〜！",
        "まずはゆっくり温まってね！\n体がほぐれると、\n街歩きも楽しくなるよ！",
        "あ、また来た？\nえっと…\nさっきも説明した気がするけど、\nここは“もとの湯”だよ。",
        "……そんなに何回も聞かれると、\nちょっとのぼせてきたかも。",
        "うん、ごめん。\nさすがにこれ以上は\n同じことしか言えないかな。"
      ],
      night: [
        "……なに。\nたこ焼き菜々は19時30分で閉店よ。\n別に、呼んでない。",
        "勘違いしないで。\nここが開いてるのは、\nたまたまだから。",
        "……まだいるの？\nべ、別に嫌じゃないけど。\n静かにして。",
        "そんなに連打しないで。\n……ちょっとは、\n落ち着きなさいよ。",
        "……もう。\n案内はここまで。\nこれ以上は、知らない。"
      ],
      vanishLine: "……べ、別に。\nまた来てもいいけど。"
    },

    kbc: {
      day: [
        "ようこそ久留米にあるKBCだ。\n球は静かに転がる。\n集中するには、\nいい場所だ。",
        "狙いすぎると外す。\n力を抜くと入る。\n不思議だな。",
        "一球ごとに、\nその人が出る。\n君は丁寧派だな。",
        "派手さはない。\nでも、\n落ち着いて遊べる。",
        "……今のショット、\n悪くなかったな。"
      ],
      night: [
        "夜のKBCだ。\n球の音が、\n少し大きく聞こえる。",
        "この時間は、\n考えすぎると\n逆に外すな。",
        "静かだけど、\n頭の中は\nにぎやかだろ。",
        "夜の一球は、\n昼より正直だな。",
        "……今日は、\nここまでにしとくか。"
      ],
      vanishLine: "……その感覚、\n覚えとけよ。"
    },

    katana: {
      day: [
        "いらっしゃい刀鍛冶やで。\n焼きたてが、\n一番や。",
        "学生さんか。\nおまけしといたろ。",
        "外は丸い。\n中はちゃんとしてる。\nそれが、\nうちのたこ焼きや。",
        "そのまま食べて\n美味いのが\nほんまもんやで。",
        "……うん。\nその顔、\n分かっとるな。"
      ],
      night: [
        "夜の刀鍛冶や。\nちょっと静かやで。",
        "この時間はな、\n一口が\n妙にうまい。",
        "たこ焼きとビール\n最高や。",
        "あんたえらい\nたこ焼きくわしいな。。",
        "……今日はここまでやな。"
      ],
      vanishLine: "……また思い出したら、\n来たらええ。"
    },

    hotel: {
      day: [
        "おぉ〜ホテルだ。\nわし、\nさっき空港に\nいた気がするんだが。",
        "旅の途中？\n人生も途中。\nたぶんな。",
        "予定？\nあった気はする。\nだが酒が勝った。",
        "ロビーってのはな、\n迷子が\n堂々としていい場所だ。",
        "今日はな…\n歩きすぎて\n地球が揺れておる。"
      ],
      night: [
        "夜のロビーは\n危険だぞ。\n酒が\nもう一杯って\n囁く。",
        "行く人と\n帰る人と\n帰れなくなった人が\n集まる時間だ。",
        "夜はな、\nどうでもいい話が\n名言に聞こえる。",
        "ここで考えた人生論は\n朝になると\n全部忘れる。",
        "……部屋番号？\n聞くな。\n今は聞くな。"
      ],
      vanishLine: "……じゃあな。\nカードは\n持ったか？\nわしは\nどこ行くんだっけ。"
    },

    bigmans: {
      day: [
        "BIGMANSだ。\n昼から投げるなら、\n集中できるぞ。",
        "狙いは中心。\nでも、\n外れて学べ。",
        "一本目は様子見。\n二本目から本番だ。",
        "力を抜け。\n指先を信じろ。",
        "……今のは、\n悪くない。"
      ],
      night: [
        "夜のBIGMANSだ。\n気持ちが\n盤に出やすい。",
        "昼より、\n迷いが\n刺さりやすいな。",
        "外してもいい。\n理由を考えろ。",
        "夜は、\n練習より\n確認だ。",
        "……今日はここまでだ。"
      ],
      vanishLine: "……その感覚、\n忘れるな。"
    },

    "twobit": {
      day: [
        "ようこそ2bitだぜ。\n気楽に投げな。",
        "外した？\n大丈夫。\nみんな外す。",
        "当たった？\n今日は運がいいな。",
        "スコア？\nあとで見ればいい。",
        "……今のは、\nちょっと惜しい。"
      ],
      night: [
        "夜の2bitだぜ。\nだいたい、\n笑い声が多い。",
        "狙いすぎると\n面白くなくなる。",
        "外れた時の\n空気も、\nイベントだ。",
        "夜は、\n記憶に残ったもん勝ち。",
        "……今日はお開き！"
      ],
      vanishLine: "……次は当たる。\nたぶん。"
    },

    hanaya: {
      day: [
        "華矢式だ。\n矢は、\n正直だ。",
        "狙いと結果。\nその差を、\n見ておけ。",
        "迷いは、\n指先に出る。",
        "外れた理由は、\n自分が知ってる。",
        "……いい顔だ。"
      ],
      night: [
        "夜は、\n考えすぎる時間だ。",
        "刺さらない時は、\n理由がある。",
        "昼より、\n感情が\n盤に出るな。",
        "答えは、\n一投先にある。",
        "……今日はここまでだ。"
      ],
      vanishLine: "……盤は、\n全部見てた。"
    },

    mars: {
      day: [
        "MARSだよ。\n静かに投げたいなら、\n合ってる。",
        "ここでは、\n集中が一番だ。",
        "一本ずつ、\n丁寧にな。",
        "焦ると、\nだいたい外す。",
        "……今の、\nいいリズムだな。"
      ],
      night: [
        "夜は、\n常連の時間だよ。",
        "多くは話さない。\nでも、\nちゃんと見てる。",
        "外してもいい。\n雑に投げるな。",
        "夜は、\n音で分かる。",
        "……今日は終わりだ。"
      ],
      vanishLine: "……続きは、\n次の夜だな。"
    },

    dollis: {
      day: [
        "昼は、\n無理しなくていい。",
        "肩が上がってる。\nまずは深呼吸だ。",
        "若い頃は勢い。\n今は、\n間合いだな。",
        "一本に意味を\n持たせろ。\n数じゃない。",
        "……悪くない。\nそのまま続けろ。"
      ],
      night: [
        "夜は、\n余計な音が消える。",
        "当てにいくな。\n入る所に、\n置くだけだ。",
        "外したか。\n顔に出すな。\n次で分かる。",
        "集中してる男は、\n静かだ。",
        "……今日は、\nここまででいい。"
      ],
      vanishLine: "……続きは、\nまた夜にしよう。"
    },

puni: {
  day: [
    "足つぼは、\n罰ゲームじゃない。",
    "美味しいものは、\n脂肪と糖で\nできている。",
    "デトックスなら、\nよもぎ蒸しだ。",
    "モリンガは、\nスーパー植物。",
    "蒸されても、\n飲んでも良し。",
    "無理しなくていい。\n身体は、\n正直だからな。",
    "昼は整える時間だ。\n攻めるのは、\nまだ早い。"
  ],
  night: [
    "深夜のマッサージは、\n至高だ。",
    "余計な力は、\n夜に抜ける。",
    "最北端へ\n行きたければ、\n私に言え。",
    "函館から稚内は、\n630キロ。",
    "JR稚内駅から、\n徒歩5分だ。",
    "オロロンラインを、\n走りに行こう。",
    "夜は、\n身体の本音が\n出やすい。"
  ],
  vanishLine: "……続きは、\nまた夜にしよう。"
},

    
    // ✅ タワー兄妹（昼：女の子／夜：男の子）
    tawa1: {
      day: [
        "こんにちはー！\nたこ焼きタワーへ\nようこそ！",
        "だいじょうぶだよ！\nゆっくり積めば\nきっとできる！",
        "ぐらぐらしてもね、\n慌てないのが\nコツなんだよ！",
        "たかく積めたら、\nすごいすごい！\nがんばって！",
        "それじゃあ、\nスタート！\nたこ焼き、いくよー！"
      ],
      night: [
        "よっしゃ！\n夜のたこ焼きタワーだ！",
        "ここからは\nドキドキするぞ！\nでも楽しい！",
        "あっ！\nくずれた！？\nもう一回だ！",
        "夜は集中すると、\nぐーんって\n積めるんだ！",
        "今日はここまで！\nまた次、\n挑戦しよう！"
      ],
      vanishLine: "またね！\nつぎは、\nもっと高くいこう！"
    }
  };

  // ✅ 必須：外部＆後続処理から参照できるように公開
  window.TALK = TALK;
  window.__isNight = isNight;

  /* =========================
     放置専用：特別セリフ集（性格バラバラ）
     - 通常の TALK(day/night) とは完全に別
  ========================= */
  window.IDLE_TALK = {
    day: {
      shy: [
        "暇だ・・・",
        "誰かタップして・・・",
        "喋りたい・・・",
        "ねぇ・・・聞いて・・・",
        "ここ、ずっと立ってる・・・"
      ],
      friendly: [
        "おーい！\n誰かいる？",
        "ちょっとでいいから\n押してよ～",
        "今なら\n空いてます！",
        "暇すぎて\n景色見てた！"
      ],
      cynical: [
        "はいはい、\n放置ですね。",
        "また背景係に\n戻りました。",
        "期待しない方が\n楽だよ。",
        "……知ってた。"
      ],
      needy: [
        "一回だけでいい。",
        "押したら\nすぐ終わるから。",
        "ここにいる意味、\nあるよね？",
        "……まだ待ってる。"
      ]
    },

    night: {
      quiet: [
        "……暇だ。",
        "……喋りたい。",
        "……夜、\n長い。",
        "……声、\n届いてる？"
      ],
      needy: [
        "……タップして。",
        "……見てるなら\n触って。",
        "……反応、\n欲しい。",
        "……一人は\n嫌だ。"
      ],
      creepy: [
        "……放置、\n好きだね。",
        "……見られてるのに\n触られない。",
        "……声が\n増えてきた。",
        "……今、\n何人\n見てる？"
      ],
      resigned: [
        "……どうせ\n来ない。",
        "……朝まで\nこのまま。",
        "……待つの、\n慣れた。",
        "……それでも\n立ってる。"
      ]
    }
  };

  /* =========================
     takomin-talk（統一ロジック）
     ✅ tawa（起動アイコン）は除外
     ✅ 画像切替 interval は全体で1本（軽量）
  ========================= */
  (() => {
    "use strict";

    const TALK = window.TALK;
    if (!TALK) return;

    const isNightNow = () => (typeof window.__isNight === "function")
      ? !!window.__isNight()
      : document.documentElement.classList.contains("is-night");

    function showBalloon(btn, text, extraClass){
      const balloon = btn.querySelector(".takomin-balloon");
      if(!balloon) return;

      balloon.style.display = "block";
      balloon.className = "takomin-balloon";
      if (extraClass) balloon.classList.add(extraClass);

      balloon.textContent = text;
      balloon.classList.add("is-show");

      clearTimeout(btn._hideTimer);
      btn._hideTimer = setTimeout(() => {
        balloon.classList.remove("is-show");
        balloon.style.display = "none";
      }, 5200);
    }

    function applyImage(btn){
      const img = btn.querySelector("img");
      if(!img) return;
      const url = isNightNow() ? img.dataset.night : img.dataset.day;
      if(url) img.src = url;
    }

    // ✅ NPCボタン取得（tawa は除外）
    function getNpcButtons(){
      return Array.from(document.querySelectorAll(".map-wrap .takomin[data-id]"))
        .filter(btn => btn.dataset.id !== "tawa") // ←重要：起動アイコンを除外
        .filter(btn => btn.querySelector(".takomin-balloon") && TALK[btn.dataset.id]);
    }

    // クリック会話
    getNpcButtons().forEach(btn => {
      const id = btn.dataset.id;
      const data = TALK[id];
      if(!data) return;

      let tapCount = 0;

      applyImage(btn);

      btn.addEventListener("click", () => {
        tapCount++;

        if(isNightNow() && tapCount >= 6){
          showBalloon(btn, data.vanishLine || "……。");
          setTimeout(() => { btn.style.display = "none"; }, 1800);
          return;
        }

        const lines = isNightNow()
          ? ((data.night && data.night.length) ? data.night : data.day)
          : ((data.day && data.day.length) ? data.day : data.night);

        if(!lines || !lines.length) return;

        const idx = Math.min(tapCount - 1, lines.length - 1);
        showBalloon(btn, lines[idx]);
      });
    });

    // ✅ 画像切替：全体で1本だけ（軽量）
    setInterval(() => {
      getNpcButtons().forEach(applyImage);
    }, 1000);

    // 放置独り言（20〜45秒）
    const IDLE_MIN = 20 * 1000;
    const IDLE_MAX = 45 * 1000;

    function rand(min, max){
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function pick(arr){
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function pickIdleLine(){
      const IDLE_TALK = window.IDLE_TALK;
      if(!IDLE_TALK) return null;

      const group = isNightNow() ? IDLE_TALK.night : IDLE_TALK.day;
      if(!group) return null;

      const personalities = Object.keys(group);
      if(!personalities.length) return null;

      const personality = pick(personalities);
      const lines = group[personality] || [];
      if(!lines.length) return null;

      return { text: pick(lines), personality };
    }

    let idleTimer = null;
    function scheduleIdle(){
      clearTimeout(idleTimer);
      idleTimer = setTimeout(runIdleTalk, rand(IDLE_MIN, IDLE_MAX));
    }

    function runIdleTalk(){
      const npcs = getNpcButtons();
      if(!npcs.length) return scheduleIdle();

      const picked = pickIdleLine();
      if(!picked) return scheduleIdle();

      const btn = pick(npcs);
      showBalloon(btn, picked.text, "idle-" + picked.personality);

      scheduleIdle();
    }

    let lastMove = 0;
    function resetIdle(e){
      if(e && e.type === "mousemove"){
        const now = Date.now();
        if(now - lastMove < 700) return;
        lastMove = now;
      }
      scheduleIdle();
    }

    ["click","pointerdown","keydown","scroll","touchstart","mousemove"]
      .forEach(ev => window.addEventListener(ev, resetIdle, { passive:true }));

    scheduleIdle();
  })();

})();

