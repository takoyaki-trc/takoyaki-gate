(() => {
  function openGame(){
    alert("🎣 起動OK！ takofish.js 読み込み成功！");
  }
  window.openTakofishGame = openGame; // ←これがないと永遠に動かない
})();
