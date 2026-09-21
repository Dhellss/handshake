/* handshake — repeat the signal after the board turns a quarter. */
(function () {
  "use strict";
  var $ = function (i) { return document.getElementById(i); };
  var board = $("board"), overlay = $("overlay"), card = $("card"), state = $("state");
  var vRound = $("v-round"), vScore = $("v-score"), vBest = $("v-best"), vLives = $("v-lives");

  function load(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}
  function save(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  var best = parseInt(load("hs.best","0"),10) || 0;
  vBest.textContent = best;

  var still = matchMedia("(max-width:600px), (prefers-reduced-motion: reduce)");
  var nodes = [];
  for (var i = 0; i < 9; i++) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "node"; b.dataset.i = i;
    b.setAttribute("aria-label", "node " + (i + 1));
    board.appendChild(b); nodes.push(b);
  }

  var seq = [], step = 0, round = 1, score = 0, lives = 3, rot = 0, accepting = false;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function hud() {
    vRound.textContent = round; vScore.textContent = score;
    var s = ""; for (var i = 0; i < lives; i++) s += "life ";
    vLives.textContent = s.trim() || "no lives";
  }

  function flash(i, cls) {
    nodes[i].classList.add(cls || "on");
    return wait(still.matches ? 220 : 380).then(function () {
      nodes[i].classList.remove(cls || "on");
      return wait(still.matches ? 120 : 150);
    });
  }

  async function playSeq() {
    accepting = false; board.classList.add("lockout");
    state.classList.remove("warn");
    state.textContent = "watch the signal — " + seq.length + " nodes";
    await wait(500);
    for (var i = 0; i < seq.length; i++) await flash(seq[i]);
    await turn();
    step = 0; accepting = true; board.classList.remove("lockout");
    state.textContent = "your turn";
  }

  async function turn() {
    var dir = round < 4 ? 1 : (Math.random() < 0.5 ? 1 : -1);
    rot += dir;
    state.textContent = dir > 0 ? "board turned right" : "board turned left";
    board.style.rotate = (rot * 90) + "deg";
    await wait(still.matches ? 450 : 750);
  }

  board.addEventListener("click", function (e) {
    var n = e.target.closest(".node");
    if (!n || !accepting) return;
    var i = +n.dataset.i;
    if (i === seq[step]) {
      flash(i);
      step++;
      if (step === seq.length) {
        accepting = false;
        score += round * 100;
        round++;
        if (round - 1 > best) { best = round - 1; save("hs.best", String(best)); vBest.textContent = best; }
        hud();
        state.textContent = "handshake accepted";
        setTimeout(next, 700);
      }
    } else {
      accepting = false;
      lives--; hud();
      flash(i, "bad");
      state.classList.add("warn");
      state.textContent = "wrong node";
      if (lives <= 0) setTimeout(over, 700);
      else setTimeout(playSeq, 900);
    }
  });

  function next() {
    seq.push((Math.random() * 9) | 0);
    hud(); playSeq();
  }

  function over() {
    card.innerHTML = '<h1 class="bad">handshake failed</h1><p>You held it for ' + (round - 1) + " rounds.</p>" +
      '<div class="score-rows"><div><span>score</span><b>' + score + "</b></div>" +
      "<div><span>best round</span><b>" + best + "</b></div></div>" +
      '<button class="btn" id="go" type="button">Try again</button>';
    overlay.hidden = false;
    $("go").addEventListener("click", function () {
      seq = []; round = 1; score = 0; lives = 3; rot = 0;
      board.style.rotate = "0deg";
      overlay.hidden = true; hud();
      seq.push((Math.random() * 9) | 0); seq.push((Math.random() * 9) | 0);
      next();
    }, { once: true });
  }

  hud();
  $("go").addEventListener("click", function () {
    overlay.hidden = true;
    seq.push((Math.random() * 9) | 0); seq.push((Math.random() * 9) | 0);
    next();
  }, { once: true });
})();
