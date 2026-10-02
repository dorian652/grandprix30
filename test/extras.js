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
