/* Grand Prix de nos 30 ans : interactions de la version rêve */
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  /* ===== Interrupteur son ===== */
  var soundOn = false; try { soundOn = localStorage.getItem("gp30-sound") === "1"; } catch(e){}
  var sbtn = $("sound-btn");
  var actx = null;
  function beep(freq, dur, vol){
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = "square"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.setValueAtTime(vol, t + dur - 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch(e) {}
  }
  function paintSound(){ if (!sbtn) return; sbtn.classList.toggle("on", soundOn); sbtn.querySelector("span").textContent = soundOn ? "Son activé" : "Son coupé"; }
  window.GP30X = {beep: beep, soundOn: function(){ return soundOn; }};
  if (sbtn) {
    paintSound();
    sbtn.addEventListener("click", function(){
      soundOn = !soundOn; try { localStorage.setItem("gp30-sound", soundOn ? "1" : "0"); } catch(e){}
      paintSound(); if (soundOn) beep(880, 0.08, 0.12);
    });
  }
  // les feux de la page émettent un bip par colonne allumée, et un long au vert (quand le son est activé)
  var lightsEl = $("lights");
  if (lightsEl) {
    var lastReds = 0, wasGreen = false;
    new MutationObserver(function(){
      var reds = lightsEl.querySelectorAll(".lcol .light:first-child.red").length;
      var green = lightsEl.querySelectorAll(".light.green").length > 0;
      if (reds > lastReds) beep(740, 0.11, 0.22);
      if (green && !wasGreen) beep(1180, 0.7, 0.26);
      lastReds = reds; wasGreen = green;
    }).observe(lightsEl, {attributes: true, subtree: true, attributeFilter: ["class"]});
  }

  /* ===== Bandeau Race control ===== */
  function tickerItems(){
    var items = [];
    var d = $("cd-d"); if (d && d.textContent.trim()) items.push("Extinction des feux dans <b>" + d.textContent.trim() + " jours</b>");
    var n = $("n-pilots"); if (n) items.push("Pilotes engagés : <b>" + n.textContent + "</b>");
    var lead = $("n-lead"); if (lead && lead.textContent !== "—") items.push("En tête du championnat : <b>" + lead.textContent + "</b>");
    var members = document.querySelectorAll(".team .member");
    if (members.length) { var m = members[members.length - 1]; var team = m.closest(".team"); items.push("Dernier engagement : <b>" + m.textContent.replace(/[✎✕]/g, "").trim() + "</b> chez <b>" + (team ? team.getAttribute("data-team") : "") + "</b>"); }
    var wt = $("w-track"), temp = $("w-temp"); if (wt && wt.textContent !== "…") items.push("Piste <b>" + wt.textContent + "</b> · air <b>" + (temp ? temp.textContent : "") + "</b> à la Palette Verte");
    var p1 = document.querySelector("#pit-list li:not(.empty)"); if (p1) items.push("Record pit stop : <b>" + p1.querySelector(".nm").textContent.replace(/[✎✕]/g, "").trim() + "</b> en <b>" + p1.querySelector(".tm").textContent + "</b>");
    items.push("Samedi 20 mars 2027 · 19h30 · La Palette Verte · Écaussinnes");
    items.push("Commissaires de course : <b>identités révélées le jour J</b>");
    return items;
  }
  function renderTicker(){
    var run = $("tk-run"); if (!run) return;
    var html = tickerItems().map(function(i){ return "<span>" + i + "</span>"; }).join("");
    if (run.innerHTML !== html) run.innerHTML = html;
  }
  setTimeout(renderTicker, 1500); setInterval(renderTicker, 20000);

  /* ===== Billet holographique : souris ou gyroscope ===== */
  var ticket = $("ticket");
  if (ticket && !reduced) {
    var holo = document.createElement("span"); holo.className = "holo"; ticket.appendChild(holo);
    var rx = 0, ry = 0, active = false;
    function apply(px, py){ // px, py dans [-1, 1]
      ry = px * 9; rx = -py * 7;
      ticket.classList.add("tilt");
      ticket.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
      holo.style.setProperty("--hx", (50 + px * 40) + "%"); holo.style.setProperty("--hy", (50 + py * 40) + "%");
    }
    function reset(){ ticket.classList.remove("tilt"); ticket.style.transform = ""; }
    if (!coarse) {
      ticket.addEventListener("pointermove", function(e){ var r = ticket.getBoundingClientRect(); apply((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1); });
      ticket.addEventListener("pointerleave", reset);
    } else {
      var gbtn = $("gyro-btn");
      function startGyro(){
        window.addEventListener("deviceorientation", function(e){
          if (e.gamma === null) return;
          apply(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
        });
        if (gbtn) gbtn.classList.remove("show");
      }
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        if (gbtn) { gbtn.classList.add("show"); gbtn.addEventListener("click", function(){ DeviceOrientationEvent.requestPermission().then(function(s){ if (s === "granted") startGyro(); }).catch(function(){}); }); }
      } else if (typeof DeviceOrientationEvent !== "undefined") { startGyro(); }
    }
  }

  /* ===== Fiches pilotes : retournement ===== */
  document.querySelectorAll(".dcard").forEach(function(c){
    function flip(){ c.classList.toggle("flipped"); }
    c.addEventListener("click", flip);
    c.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  });

  /* ===== Fumée de pneus et DRS sur le muret ===== */
  var car = $("scrollcar"), drs = $("drs"), speed = $("speed");
  if (car && !reduced) {
    var lastY = window.scrollY, lastT = performance.now(), smokeT = 0;
    window.addEventListener("scroll", function(){
      var now = performance.now(), v = Math.abs(window.scrollY - lastY) / Math.max(16, now - lastT);
      lastY = window.scrollY; lastT = now;
      var fast = v > 1.6;
      if (drs) drs.classList.toggle("on", fast);
      if (fast && now - smokeT > 45) {
        smokeT = now;
        var r = car.getBoundingClientRect();
        for (var k = 0; k < 2; k++) {
          var s = document.createElement("span"); s.className = "smoke";
          s.style.left = (r.left + 6 + Math.random() * 10) + "px"; s.style.top = (r.top + r.height - 10 + Math.random() * 6 - (k ? 0 : r.height - 14)) + "px";
          document.body.appendChild(s); setTimeout(function(el){ el.remove(); }.bind(null, s), 900);
        }
      }
    }, {passive: true});
  }

  /* ===== Apparitions au défilement ===== */
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, {rootMargin: "0px 0px -8% 0px"});
    document.querySelectorAll("section .sec-head, section .card, .team, .radio, .flagcard, .pitboard, .standings, .leader").forEach(function(el){ el.classList.add("rv"); io.observe(el); });
  }

  /* ===== Circuit en relief ===== */
  var track = document.querySelector(".track-card");
  if (track && !coarse && !reduced) {
    track.addEventListener("pointermove", function(e){ var r = track.getBoundingClientRect(); var px = (e.clientX - r.left) / r.width * 2 - 1, py = (e.clientY - r.top) / r.height * 2 - 1; track.classList.add("tilt"); track.style.transform = "rotateX(" + (-py * 6).toFixed(2) + "deg) rotateY(" + (px * 8).toFixed(2) + "deg)"; });
    track.addEventListener("pointerleave", function(){ track.classList.remove("tilt"); track.style.transform = ""; });
  }
})();

/* ===== Deuxième passe : pratique ===== */
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Navigation du bas : défilement doux et section active */
  var links = document.querySelectorAll(".pitnav a");
  links.forEach(function(a){ a.addEventListener("click", function(e){ var t = document.querySelector(a.getAttribute("href")); if (t) { e.preventDefault(); t.scrollIntoView({behavior: reduced ? "auto" : "smooth", block: "start"}); } }); });
  if ("IntersectionObserver" in window && links.length) {
    var map = {}; links.forEach(function(a){ map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { links.forEach(function(a){ a.classList.remove("on"); }); var a = map[e.target.id]; if (a) a.classList.add("on"); } }); }, {rootMargin: "-40% 0px -50% 0px"});
    Object.keys(map).forEach(function(id){ var el = $(id); if (el) io.observe(el); });
  }

  /* Partager l'invitation */
  var share = $("share-btn");
  if (share) share.addEventListener("click", function(){
    var url = "https://grandprix30ans.be/", text = "Grand Prix de nos 30 ans · Lucie & Lilian · samedi 20 mars 2027, 19h30, La Palette Verte, Écaussinnes. Choisis ton écurie !";
    if (navigator.share) navigator.share({title: "Grand Prix de nos 30 ans", text: text, url: url}).catch(function(){});
    else if (navigator.clipboard) navigator.clipboard.writeText(text + " " + url).then(function(){ share.querySelector("span").textContent = "Lien copié"; setTimeout(function(){ share.querySelector("span").textContent = "Partager"; }, 2000); });
  });

  /* Accueil personnalisé (d'après l'inscription mémorisée sur l'appareil) */
  function welcome(){
    var w = $("welcome"); if (!w) return;
    var saved = null; try { saved = JSON.parse(localStorage.getItem("gp30-entry") || "null"); } catch(e){}
    if (!saved || !saved.pilot1) { w.hidden = true; return; }
    var teamBtn = document.querySelector('.team[data-team="' + saved.team + '"]');
    var color = teamBtn ? getComputedStyle(teamBtn).getPropertyValue("--tc").trim() : "";
    var code = teamBtn ? (teamBtn.querySelector(".tcode") ? teamBtn.querySelector(".tcode").textContent : saved.team.slice(0, 3).toUpperCase()) : "";
    var first = saved.pilot1.split(" ")[0];
    var best = null; try { best = parseFloat(localStorage.getItem("gp30-pit")) || null; } catch(e){}
    w.style.setProperty("--wc", color || "var(--red)");
    w.innerHTML = '<span class="w-badge">' + (code || "P") + '</span><div class="w-text"><b>Bonjour ' + first + '</b><span>Vous roulez pour ' + saved.team + (best ? ' · votre record pit stop : ' + (best / 1000).toFixed(2).replace(".", ",") + ' s' : ' · tentez le pit stop challenge') + '</span></div>' +
      '<div class="w-links"><a href="#grille">Changer d\'écurie</a><a href="#pitstop">Pit stop</a><a href="test/galerie.html">Photos</a></div>';
    w.hidden = false;
  }
  setTimeout(welcome, 1200); setInterval(welcome, 15000);
  var regForm = $("reg-form"); if (regForm) regForm.addEventListener("submit", function(){ setTimeout(welcome, 1500); });

  /* Recherche d'un pilote dans la grille */
  var q = $("team-search");
  if (q) {
    var cnt = $("search-count");
    function norm(s){ return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    function run(){
      var v = norm(q.value.trim()); var hits = 0, firstTeam = null;
      document.querySelectorAll(".team").forEach(function(t){
        var any = false;
        t.querySelectorAll(".member").forEach(function(m){ var h = v && norm(m.textContent).indexOf(v) >= 0; m.classList.toggle("hit", !!h); if (h) { any = true; hits++; } });
        t.classList.toggle("dim", !!v && !any);
        if (any && !firstTeam) firstTeam = t;
      });
      if (cnt) cnt.textContent = v ? (hits + (hits > 1 ? " pilotes trouvés" : " pilote trouvé")) : "";
      if (firstTeam && v.length >= 3) firstTeam.scrollIntoView({behavior: reduced ? "auto" : "smooth", block: "nearest"});
    }
    q.addEventListener("input", run);
    var teamsEl = $("teams"); if (teamsEl) new MutationObserver(function(){ if (q.value) run(); }).observe(teamsEl, {childList: true});
  }

  /* Cartes d'écurie en relief (souris) */
  if (!coarse && !reduced) {
    document.addEventListener("pointermove", function(e){
      var t = e.target.closest && e.target.closest(".team"); if (!t) return;
      var r = t.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * 2 - 1, py = (e.clientY - r.top) / r.height * 2 - 1;
      t.classList.add("tilt3d"); t.style.transform = "rotateX(" + (-py * 5).toFixed(2) + "deg) rotateY(" + (px * 6).toFixed(2) + "deg) translateY(-2px)";
    });
    document.addEventListener("pointerout", function(e){ var t = e.target.closest && e.target.closest(".team"); if (t && !t.contains(e.relatedTarget)) { t.classList.remove("tilt3d"); t.style.transform = ""; } });
  }
})();


/* ===== Chargement différé de la 3D ===== */
(function(){
  var stage = document.getElementById("stage3d"); if (!stage) return;
  var conn = navigator.connection || {};
  if (conn.saveData) { stage.classList.add("no3d"); return; }
  function loadScript(src){ return new Promise(function(res, rej){ var sc = document.createElement("script"); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }); }
  function go(){
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
      .then(function(){ return loadScript(stage.getAttribute("data-engine")); })
      .then(function(){
        // le panneau des feux devient un HUD dans la scène
        var panel = document.getElementById("light-panel");
        if (panel && stage.classList.contains("ready")) { stage.appendChild(panel); panel.classList.add("hud"); }
      })
      .catch(function(){ stage.classList.add("no3d"); });
  }
  if (document.readyState === "complete") setTimeout(go, 200); else window.addEventListener("load", function(){ setTimeout(go, 200); });
})();

/* ===== Troisième passe : jeu et grille ===== */
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var beep = function(f, d, v){ if (window.GP30X) window.GP30X.beep(f, d, v); };
  var fmt = function(ms){ return (ms / 1000).toFixed(2).replace(".", ","); };
  var sfmt = function(ms){ return (ms >= 0 ? "+" : "−") + fmt(Math.abs(ms)); };
  var esc = function(str){ return String(str).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };

  /* ---------- Pit stop : feux 3-2-1, faux départ, intermédiaires, écarts ---------- */
  var go = $("pit-go"), cd = $("pit-cd"), word = $("cd-word"), pit = $("pit"), reset = $("pit-reset");
  var wheels = Array.prototype.slice.call(document.querySelectorAll("#pit .wheel"));
  var splits = $("pit-splits"), delta = $("pit-delta");
  if (go && cd) {
    var armed = false, timers = [], counting = false, t0 = 0, bestBefore = null, done = 0;
    function lights(n){ var li = cd.querySelectorAll(".cd-lights i"); li.forEach(function(el, i){ el.classList.toggle("red", i < n); el.classList.remove("green"); }); }
    function allGreen(){ cd.querySelectorAll(".cd-lights i").forEach(function(el){ el.classList.remove("red"); el.classList.add("green"); }); }
    function clearTimers(){ timers.forEach(clearTimeout); timers = []; }
    function resetSplits(){ if (!splits) return; splits.querySelectorAll("span").forEach(function(sp){ sp.className = ""; sp.querySelector("b").textContent = "–"; }); done = 0; }
    function startCountdown(){
      counting = true; go.hidden = true; if (reset) reset.hidden = true;
      try { bestBefore = parseFloat(localStorage.getItem("gp30-pit")) || null; } catch(e){ bestBefore = null; }
      resetSplits(); if (delta) delta.hidden = true;
      cd.classList.remove("jump", "go"); cd.classList.add("on"); lights(0); word.textContent = "Prêt";
      $("pit-verdict").textContent = "Les mécaniciens se mettent en place…";
      [1, 2, 3].forEach(function(n){ timers.push(setTimeout(function(){ lights(n); word.textContent = String(4 - n); beep(740, 0.11, 0.22); }, 500 + n * 600)); });
      var hold = 2300 + 500 + Math.random() * 1200;
      timers.push(setTimeout(function(){
        counting = false; allGreen(); word.textContent = "GO"; cd.classList.add("go"); beep(1180, 0.5, 0.26);
        armed = true; t0 = performance.now(); go.hidden = false; go.click(); go.hidden = true; armed = false;
        timers.push(setTimeout(function(){ cd.classList.remove("on", "go"); }, 220));
      }, hold));
    }
    function jumpStart(){
      if (!counting) return;
      clearTimers(); counting = false;
      cd.classList.add("jump"); word.textContent = "Faux départ"; beep(220, 0.35, 0.25);
      $("pit-verdict").textContent = "Faux départ : les commissaires vous renvoient en grille. Attendez le vert.";
      timers.push(setTimeout(function(){ cd.classList.remove("on", "jump"); go.hidden = false; }, 1300));
    }
    // intercepté en phase de capture sur le parent : passe avant le gestionnaire de la page dans tous les navigateurs
    go.parentNode.addEventListener("click", function(e){
      if (e.target !== go || armed) return;   // armé = vrai départ, le gestionnaire de la page prend le relais
      e.stopImmediatePropagation(); e.preventDefault();
      startCountdown();
    }, true);
    cd.addEventListener("pointerdown", function(e){ e.preventDefault(); jumpStart(); });
    if (pit) pit.addEventListener("pointerdown", function(e){ if (counting && e.target !== cd && !cd.contains(e.target)) jumpStart(); }, true);
    if (reset) reset.addEventListener("click", function(){ clearTimers(); counting = false; cd.classList.remove("on", "jump", "go"); resetSplits(); if (delta) delta.hidden = true; });
    // intermédiaires : un par roue, code couleur à la F1 (violet = très rapide, vert = rapide, jaune = à améliorer)
    wheels.forEach(function(w){
      w.addEventListener("click", function(){
        if (!splits || !t0 || !w.classList.contains("done") || w.getAttribute("data-split")) return;
        var ms = performance.now() - t0; done++;
        var seg = splits.querySelector('span[data-s="' + (done - 1) + '"]'); if (!seg) return;
        seg.querySelector("b").textContent = fmt(ms); seg.querySelector("small").textContent = w.getAttribute("aria-label").replace("Roue ", "").replace("arrière", "AR").replace("avant", "AV").replace("gauche", "G").replace("droite", "D");
        var per = ms / done; seg.className = per < 450 ? "purple" : (per < 900 ? "green" : "yellow");
        w.setAttribute("data-split", "1");
        if (done === 4) setTimeout(showDelta, 30, ms);
      });
    });
    function showDelta(ms){
      if (!delta) return;
      var lines = [];
      var wr = ms - 1800;
      if (bestBefore) { var d = ms - bestBefore; lines.push('<span class="' + (d < 0 ? "good" : "bad") + '"><small>Votre record</small><b>' + (d < 0 ? "Battu de " + fmt(-d) + " s" : sfmt(d) + " s") + '</b></span>'); }
      else lines.push('<span class="neutral"><small>Votre record</small><b>Temps de référence</b></span>');
      var p1 = document.querySelector("#pit-list li:not(.empty)");
      if (p1) { var p1ms = parseFloat(p1.querySelector(".tm").textContent.replace(",", ".")) * 1000, dp = ms - p1ms; lines.push('<span class="' + (dp < 0 ? "good" : "bad") + '"><small>Meilleur temps de la grille</small><b>' + (dp < 0 ? "Vous passez P1" : sfmt(dp) + " s") + '</b></span>'); }
      lines.push('<span class="' + (wr < 0 ? "good" : "neutral") + '"><small>Record du monde (1,80 s)</small><b>' + (wr < 0 ? "Battu !" : sfmt(wr) + " s") + '</b></span>');
      delta.innerHTML = lines.join(""); delta.hidden = false;
      wheels.forEach(function(w){ w.removeAttribute("data-split"); }); t0 = 0;
    }
  }

  /* ---------- Podium 3D des constructeurs ---------- */
  var podium = $("podium"), stageP = $("podium-stage"), standings = $("standings-list"), riseTimer = null;
  function renderPodium(){
    if (!podium || !standings) return;
    var rows = Array.prototype.slice.call(standings.querySelectorAll("li")).slice(0, 3);
    if (rows.length < 1) { podium.hidden = true; return; }
    var order = [1, 0, 2]; // P2 à gauche, P1 au centre, P3 à droite
    var html = "";
    order.forEach(function(idx){
      var r = rows[idx];
      if (!r) { html += '<div class="pstep p' + (idx + 1) + ' empty"><div class="pteam"><span class="pname">Place libre</span><span class="pcount">Votre écurie ?</span></div><div class="pbox"><div class="ptop"></div><div class="pside l"></div><div class="pside r"></div><div class="pfront"><span>' + (idx + 1) + '</span></div></div></div>'; return; }
      var color = r.style.getPropertyValue("--tc").trim() || "var(--red)";
      var id = r.querySelector(".team-id"), n = r.querySelector(".n").textContent.trim();
      var badge = id ? (id.querySelector(".tlogo") ? id.querySelector(".tlogo").outerHTML : (id.querySelector(".tcode") ? id.querySelector(".tcode").outerHTML : "")) : "";
      var name = id ? id.textContent.replace(/^[A-Z]{3}/, "").trim() : "";
      html += '<div class="pstep p' + (idx + 1) + '" style="--tc:' + color + '"><div class="pteam">' + badge + '<span class="pname">' + esc(name) + '</span><span class="pcount">' + n + (n === "1" ? " pilote" : " pilotes") + '</span></div><div class="pbox"><div class="ptop"></div><div class="pside l"></div><div class="pside r"></div><div class="pfront"><span>' + (idx + 1) + '</span></div></div></div>';
    });
    if (stageP.innerHTML !== html) {
      stageP.innerHTML = html;
      if (!podium.querySelector(".podium-floor")) { var fl = document.createElement("div"); fl.className = "podium-floor"; stageP.after(fl); }
      // l'animation d'apparition est retirée une fois jouée : une animation persistante aplatit la 3D dans Chrome
      if (!reduced) { clearTimeout(riseTimer); stageP.classList.remove("rise"); void stageP.offsetWidth; stageP.classList.add("rise"); riseTimer = setTimeout(function(){ stageP.classList.remove("rise"); }, 1300); }
    }
    podium.hidden = false;
  }
  if (standings) { new MutationObserver(renderPodium).observe(standings, {childList: true}); setTimeout(renderPodium, 800); }

  /* ---------- Forfaits ---------- */
  var FF = "Forfait";
  var ffToggle = $("forfait-toggle"), ffForm = $("forfait-form"), ffName = $("ff-name"), ffStatus = $("ff-status"), ffList = $("ff-list"), ffPill = $("pill-forfaits"), ffN = $("n-forfaits");
  function ffEntries(){ return window.GP30 ? window.GP30.entries().filter(function(e){ return e.team === FF; }) : []; }
  function renderForfaits(){
    if (!ffPill || !window.GP30) return;
    var list = ffEntries();
    ffPill.hidden = !list.length; ffN.textContent = list.length;
    if (ffList) {
      if (window.GP30.admin() && list.length) {
        ffList.hidden = false;
        ffList.innerHTML = '<span class="eyebrow">Forfaits déclarés (visible par les organisateurs)</span><div class="members">' + list.map(function(e){ return '<span class="member">' + esc(e.pilot1) + '<i class="x" data-ffdel="' + esc(e.id) + '" title="Retirer ce forfait">✕</i></span>'; }).join("") + '</div>';
        ffList.querySelectorAll("[data-ffdel]").forEach(function(x){ x.addEventListener("click", function(){ window.GP30.adminDelete("admin_delete", x.getAttribute("data-ffdel")); }); });
      } else ffList.hidden = true;
    }
  }
  if (ffToggle && ffForm) {
    ffToggle.addEventListener("click", function(){ var open = ffForm.hidden; ffForm.hidden = !open; ffToggle.setAttribute("aria-expanded", String(open)); if (open) { var n = $("f-p1"); if (n && n.value && !ffName.value) ffName.value = n.value; ffName.focus(); } });
    ffForm.addEventListener("submit", function(e){
      e.preventDefault(); if (!window.GP30) return;
      var G = window.GP30, raw = ffName.value.trim();
      if (G.norm(raw).split(" ").length < 2) { ffStatus.textContent = "Indiquez votre prénom et votre nom, pour qu'on sache qui ne vient pas."; ffStatus.className = "status err"; ffName.focus(); return; }
      var name = raw.replace(/\s+/g, " ").split(" ").map(function(w){ return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
      var key = G.keyOf(name), btn = $("ff-btn"); btn.disabled = true; ffStatus.textContent = "Transmission au stand…"; ffStatus.className = "status";
      var dupes = G.entries().filter(function(en){ return en.id !== key && G.keyOf(en.pilot1) === key; }), chain = Promise.resolve();
      dupes.forEach(function(d){ chain = chain.then(function(){ return G.postEntry({id: d.id, action: "delete"}); }); });
      chain.then(function(){ return G.postEntry({id: key, team: FF, pilot1: name, pilot2: "", note: "forfait"}); }).then(function(res){
        btn.disabled = false;
        if (res && res.ok) {
          if (res.entries) { G.entries().splice(0, G.entries().length); res.entries.forEach(function(x){ G.entries().push(x); }); }
          try { localStorage.removeItem("gp30-entry"); } catch(err){}
          if (G.team() && G.team() !== FF) G.team(null);
          G.renderTeams(); G.renderSide(); renderForfaits();
          ffStatus.textContent = "Forfait enregistré pour " + name + ". Vous nous manquerez sur la grille."; ffStatus.className = "status ok";
          var w = $("welcome"); if (w) w.hidden = true;
        } else { ffStatus.textContent = "Le stand n'a pas reçu le message. Réessayez."; ffStatus.className = "status err"; }
      }).catch(function(){ btn.disabled = false; ffStatus.textContent = "Le stand n'a pas reçu le message. Vérifiez votre connexion."; ffStatus.className = "status err"; });
    });
  }
  var teamsEl = $("teams"); if (teamsEl) new MutationObserver(renderForfaits).observe(teamsEl, {childList: true});
  setTimeout(renderForfaits, 900);
})();
