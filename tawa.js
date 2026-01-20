/* =========================
  たこ焼きバランスタワー（最小版）
========================= */
(() => {
  const btn = document.querySelector('.takomin[data-id="tawa"]');
  if (!btn) return;

  const modal = document.getElementById('tawaModal');
  const canvas = document.getElementById('tawaCanvas');
  const scoreEl = document.getElementById('tawaScore');
  const btnClose = document.getElementById('tawaClose');
  const btnRestart = document.getElementById('tawaRestart');

  function applyTawaIcon(){
    const img = btn.querySelector('img');
    if (!img) return;
    const isNight = document.documentElement.classList.contains('is-night');
    const daySrc = img.getAttribute('data-day') || img.src;
    const nightSrc = img.getAttribute('data-night') || img.src;
    img.src = isNight ? nightSrc : daySrc;
  }
  applyTawaIcon();
  new MutationObserver(applyTawaIcon)
    .observe(document.documentElement, { attributes:true });

  let Engine, Render, Runner, Bodies, Body, Composite, Events;
  let engine, render, runner;
  let currentBall = null;
  let swinging = true;
  let swingDir = 1;
  let score = 0;
  let gameOver = false;

  const W = canvas.width;
  const H = canvas.height;
  const BALL_R = 18;
  const SPAWN_Y = 70;

  function setScore(v){
    score = v;
    scoreEl.textContent = String(score);
  }

  function openModal(){
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    startGame();
  }

  function closeModal(){
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    stopGame();
  }

  function startGame(){
    stopGame();
    ({ Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter);

    engine = Engine.create();
    engine.gravity.y = 1;

    render = Render.create({
      canvas,
      engine,
      options:{
        width: W,
        height: H,
        wireframes:false,
        background:'#0b0b0b'
      }
    });

    runner = Runner.create();

    const ground = Bodies.rectangle(W/2, H-30, W-40, 22, { isStatic:true });
    Composite.add(engine.world, ground);

    setScore(0);
    gameOver = false;
    spawnBall();

    Events.on(engine, 'beforeUpdate', () => {
      if (gameOver) return;

      if (currentBall && swinging){
        const p = currentBall.position;
        if (p.x > W-60) swingDir = -1;
        if (p.x < 60) swingDir = 1;
        Body.setPosition(currentBall, { x:p.x + 2.2*swingDir, y:SPAWN_Y });
        Body.setVelocity(currentBall, { x:0, y:0 });
        Body.setAngularVelocity(currentBall, 0);
      }

      for (const b of Composite.allBodies(engine.world)){
        if (!b.isStatic && b.position.y > H+120){
          endGame();
          break;
        }
      }
    });

    Render.run(render);
    Runner.run(runner, engine);
  }

  function stopGame(){
    try{
      if (render) Matter.Render.stop(render);
      if (runner && engine) Matter.Runner.stop(runner);
      if (engine) Matter.World.clear(engine.world, false);
    }catch(e){}
    engine = null;
  }

  function spawnBall(){
    swinging = true;
    const ball = Bodies.circle(W/2, SPAWN_Y, BALL_R, {
      restitution:0.05,
      friction:0.9
    });
    currentBall = ball;
    Composite.add(engine.world, ball);
  }

  function dropBall(){
    if (!engine || !swinging) return;
    swinging = false;
    Body.setAngularVelocity(currentBall, (Math.random()*0.06)-0.03);
    setTimeout(() => {
      if (!gameOver){
        setScore(score+1);
        spawnBall();
      }
    }, 950);
  }

  function endGame(){
    gameOver = true;
    const balloon = btn.querySelector('.takomin-balloon');
    if (balloon){
      balloon.textContent = '焼き直しだな…';
      setTimeout(()=> balloon.textContent='', 1800);
    }
  }

  btn.addEventListener('click', e => {
    e.preventDefault();
    openModal();
  });

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    dropBall();
  });

  btnRestart.addEventListener('click', startGame);
  btnClose.addEventListener('click', closeModal);

})();
