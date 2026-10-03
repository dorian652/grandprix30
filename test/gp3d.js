/* Grand Prix de nos 30 ans : moteur 3D (three.js r128, UMD). Monoplace low-poly originale réutilisable, scènes de l'en-tête et du pit stop. */
(function(){
  if (typeof THREE === "undefined") return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function srgb(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }
  function box(w, h, d, mat, x, y, z){ var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; return m; }

  /* ---------- Monoplace : axe X = avant, Z = largeur ---------- */
  function buildCar(colorHex){
    var body = new THREE.MeshStandardMaterial({color: srgb(colorHex || "#c8102e"), metalness: 0.45, roughness: 0.32});
    var carbon = new THREE.MeshStandardMaterial({color: 0x15151a, metalness: 0.7, roughness: 0.42});
    var tyre = new THREE.MeshStandardMaterial({color: 0x0d0d0d, metalness: 0.1, roughness: 0.92});
    var rimMat = new THREE.MeshStandardMaterial({color: 0x9a9aa0, metalness: 0.95, roughness: 0.25});
    var cream = new THREE.MeshStandardMaterial({color: srgb("#efe7d8"), metalness: 0.2, roughness: 0.4});
    var yellow = new THREE.MeshStandardMaterial({color: srgb("#f5c518"), metalness: 0.2, roughness: 0.5});
    var glass = new THREE.MeshStandardMaterial({color: 0x101418, metalness: 0.9, roughness: 0.1});

    var car = new THREE.Group();
    car.add(box(3.2, 0.05, 1.5, carbon, 0.1, 0.12, 0));
    car.add(box(1.6, 0.34, 0.52, body, -0.2, 0.33, 0));
    car.add(box(0.9, 0.26, 0.4, body, 1.0, 0.32, 0));
    var nose = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 1.1, 20), body); nose.rotation.z = -Math.PI / 2; nose.position.set(1.95, 0.3, 0); nose.castShadow = true; car.add(nose);
    car.add(box(1.3, 0.3, 0.42, body, -0.85, 0.5, 0));
    car.add(box(0.42, 0.26, 0.34, body, -0.2, 0.72, 0));
    car.add(box(0.08, 0.16, 0.22, carbon, 0.02, 0.74, 0));
    car.add(box(1.0, 0.3, 0.02, carbon, -1.1, 0.78, 0));
    [1, -1].forEach(function(s){
      car.add(box(1.5, 0.3, 0.42, body, -0.1, 0.3, s * 0.5));
      car.add(box(0.1, 0.22, 0.3, carbon, 0.66, 0.32, s * 0.5));
      car.add(box(0.5, 0.06, 0.2, carbon, 0.95, 0.2, s * 0.62));
      car.add(box(0.1, 0.06, 0.08, carbon, 0.55, 0.6, s * 0.32));
    });
    var cockpit = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 20), carbon); cockpit.position.set(0.25, 0.5, 0); car.add(cockpit);
    var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), cream); helmet.position.set(0.22, 0.62, 0); helmet.castShadow = true; car.add(helmet);
    var visor = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 16, Math.PI * 1.75, Math.PI * 0.5, Math.PI * 0.35, Math.PI * 0.3), glass); visor.position.copy(helmet.position); car.add(visor);
    var haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.028, 10, 40, Math.PI), carbon); haloRing.rotation.x = Math.PI / 2; haloRing.rotation.z = Math.PI / 2; haloRing.position.set(0.25, 0.7, 0); car.add(haloRing);
    var haloPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.34, 10), carbon); haloPillar.rotation.z = Math.PI / 2.6; haloPillar.position.set(0.56, 0.62, 0); car.add(haloPillar);
    car.add(box(0.36, 0.03, 1.9, body, 2.45, 0.14, 0));
    var fl2 = box(0.22, 0.025, 1.7, carbon, 2.28, 0.2, 0); fl2.rotation.z = 0.25; car.add(fl2);
    var fl3 = box(0.14, 0.02, 1.5, body, 2.16, 0.27, 0); fl3.rotation.z = 0.45; car.add(fl3);
    [1, -1].forEach(function(s){ car.add(box(0.6, 0.26, 0.03, carbon, 2.35, 0.26, s * 0.95)); });
    car.add(box(0.34, 0.03, 1.1, body, -1.75, 0.82, 0));
    var drs = box(0.18, 0.025, 1.05, carbon, -1.9, 0.9, 0); drs.rotation.z = -0.35; car.add(drs);
    [1, -1].forEach(function(s){ car.add(box(0.7, 0.4, 0.03, carbon, -1.72, 0.72, s * 0.56)); });
    car.add(box(0.06, 0.4, 0.04, carbon, -1.62, 0.6, 0));
    car.add(box(0.5, 0.12, 0.6, carbon, -1.7, 0.2, 0));

    var wheels = [];
    function wheel(x, z, r, w){
      var g = new THREE.Group();
      var t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 36), tyre); t.rotation.x = Math.PI / 2; t.castShadow = true; g.add(t);
      var rimDisc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.01, 24), rimMat); rimDisc.rotation.x = Math.PI / 2; g.add(rimDisc);
      var stripe = new THREE.Mesh(new THREE.TorusGeometry(r * 0.86, 0.012, 6, 48), yellow); stripe.position.z = (z > 0 ? 1 : -1) * (w / 2 + 0.002); g.add(stripe);
      var stripe2 = stripe.clone(); stripe2.position.z = -stripe.position.z; g.add(stripe2);
      g.position.set(x, r, z); g.userData.home = g.position.clone(); g.userData.r = r; wheels.push(g); return g;
    }
    car.add(wheel(-1.15, 0.78, 0.36, 0.42)); car.add(wheel(-1.15, -0.78, 0.36, 0.42));
    car.add(wheel(1.5, 0.74, 0.33, 0.32)); car.add(wheel(1.5, -0.74, 0.33, 0.32));
    function arm(x1, y1, z1, x2, y2, z2){
      var a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), len = a.distanceTo(b);
      var m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 8), carbon);
      m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m;
    }
    [1, -1].forEach(function(s){
      car.add(arm(1.5, 0.42, s * 0.52, 1.3, 0.4, s * 0.2)); car.add(arm(1.5, 0.42, s * 0.52, 1.7, 0.36, s * 0.2)); car.add(arm(1.5, 0.22, s * 0.52, 1.5, 0.2, s * 0.2));
      car.add(arm(-1.15, 0.46, s * 0.55, -0.9, 0.44, s * 0.25)); car.add(arm(-1.15, 0.46, s * 0.55, -1.4, 0.4, s * 0.25)); car.add(arm(-1.15, 0.24, s * 0.55, -1.1, 0.22, s * 0.25));
    });
    (function(){
      var c = document.createElement("canvas"); c.width = 256; c.height = 128; var x = c.getContext("2d");
      x.clearRect(0, 0, 256, 128); x.fillStyle = "#efe7d8"; x.font = "900 96px 'Barlow Condensed', Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("30", 128, 66);
      var m = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), transparent: true});
      var p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), m); p.rotation.x = -Math.PI / 2; p.rotation.z = -Math.PI / 2; p.position.set(-0.75, 0.655, 0); car.add(p);
    })();
    return {group: car, wheels: wheels, body: body};
  }

  /* ---------- Sol ---------- */
  function asphaltTexture(withLine){
    var c = document.createElement("canvas"); c.width = 1024; c.height = 1024; var x = c.getContext("2d");
    x.fillStyle = "#0e0c0a"; x.fillRect(0, 0, 1024, 1024);
    var img = x.getImageData(0, 0, 1024, 1024), d = img.data;
    for (var i = 0; i < d.length; i += 4) { var n = (Math.random() * 14) | 0; d[i] += n; d[i+1] += n * 0.9; d[i+2] += n * 0.8; }
    x.putImageData(img, 0, 0);
    if (withLine) {
      for (var r = 0; r < 2; r++) for (var k = 0; k < 32; k++) { x.fillStyle = (k + r) % 2 ? "#efe7d8" : "#151210"; x.fillRect(484 + r * 28, k * 32, 28, 32); }
      for (var j = 0; j < 32; j++) { x.fillStyle = j % 2 ? "#c8102e" : "#efe7d8"; x.fillRect(0, j * 32, 22, 32); x.fillRect(1002, j * 32, 22, 32); }
    } else {
      // emplacement de stand : boîte jaune et marques au sol
      x.strokeStyle = "#f5c518"; x.lineWidth = 10; x.strokeRect(160, 300, 704, 424);
      x.fillStyle = "#f5c518"; for (var q = 0; q < 6; q++) x.fillRect(200 + q * 110, 290, 40, 6);
    }
    var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function fadeAlpha(){
    var c = document.createElement("canvas"); c.width = c.height = 512; var x = c.getContext("2d");
    var g = x.createRadialGradient(256, 256, 60, 256, 256, 256); g.addColorStop(0, "#fff"); g.addColorStop(0.55, "#ddd"); g.addColorStop(1, "#000");
    x.fillStyle = g; x.fillRect(0, 0, 512, 512); return new THREE.CanvasTexture(c);
  }

  /* ---------- Scène générique ---------- */
  function createScene(host, opts){
    opts = opts || {};
    var canvas = document.createElement("canvas");
    var gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return null;
    var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance"});
    var lowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 3);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.25 : 1.75));
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(canvas);

    var scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x0f0d0c, opts.fog || 0.055);
    var camera = new THREE.PerspectiveCamera(opts.fov || 32, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xfff1dc, 0x16100c, 0.55));
    var key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(4, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.bias = -0.0005; scene.add(key);
    var fill = new THREE.DirectionalLight(0xffd9c2, 0.35); fill.position.set(-6, 3, -2); scene.add(fill);
    var rim = new THREE.SpotLight(0xff3b4d, 1.2, 30, Math.PI / 5, 0.6, 1); rim.position.set(-2, 4, -7); scene.add(rim);
    var glow = new THREE.PointLight(0xc8102e, 0.9, 12, 2); glow.position.set(0, 0.6, -3); scene.add(glow);

    var floorMat = new THREE.MeshStandardMaterial({map: asphaltTexture(opts.startLine !== false), alphaMap: fadeAlpha(), roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.9});
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    var built = buildCar(opts.color); var car = built.group; scene.add(car);
    var reflection = car.clone(true);
    reflection.traverse(function(o){ if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.16; o.castShadow = false; } });
    reflection.scale.y = -1; reflection.position.y = -0.005; scene.add(reflection);
    var blob = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0.35}));
    blob.rotation.x = -Math.PI / 2; blob.scale.set(1.25, 0.55, 1); blob.position.set(0.15, 0.002, 0); scene.add(blob);

    var lamps = [], gantryLight = null;
    if (opts.gantry) {
      var gantry = new THREE.Group();
      var carbon = new THREE.MeshStandardMaterial({color: 0x15151a, metalness: 0.7, roughness: 0.42});
      gantry.add(box(0.12, 0.12, 7.2, carbon, 0, 3.1, 0));
      [1, -1].forEach(function(s){ var post = box(0.1, 3.2, 0.1, carbon, 0, 1.55, s * 3.55); post.castShadow = false; gantry.add(post); });
      for (var i = 0; i < 5; i++) {
        var panel = box(0.12, 0.62, 0.3, carbon, 0, 2.7, (i - 2) * 0.7); panel.castShadow = false; gantry.add(panel);
        var col = [];
        for (var r = 0; r < 2; r++) { var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshStandardMaterial({color: 0x2a1c1c, emissive: 0x000000, roughness: 0.3})); lamp.position.set(0.08, 2.85 - r * 0.3, (i - 2) * 0.7); gantry.add(lamp); col.push(lamp); }
        lamps.push(col);
      }
      gantry.position.x = 3.6; scene.add(gantry);
      gantryLight = new THREE.PointLight(0xff2a3c, 0, 9, 2); gantryLight.position.set(3.4, 2.6, 0); scene.add(gantryLight);
    }
    function setLamp(i, state){
      if (!lamps[i]) return;
      lamps[i].forEach(function(l){
        if (state === "red") { l.material.color.set(0xff2a3c); l.material.emissive.set(0xff2a3c); }
        else if (state === "green") { l.material.color.set(0x38f27a); l.material.emissive.set(0x38f27a); }
        else { l.material.color.set(0x2a1c1c); l.material.emissive.set(0x000000); }
      });
    }

    var state = {angle: opts.angle || 0.9, targetAngle: opts.angle || 0.9, elev: 0.32, pointer: {x: 0, y: 0}, scrollK: 0, visible: true, last: performance.now(), anims: []};
    function resize(){ var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    resize(); window.addEventListener("resize", resize);
    if (opts.orbit) {
      host.addEventListener("pointermove", function(e){ var r = host.getBoundingClientRect(); state.pointer.x = (e.clientX - r.left) / r.width - 0.5; state.pointer.y = (e.clientY - r.top) / r.height - 0.5; });
      host.addEventListener("pointerleave", function(){ state.pointer.x = 0; state.pointer.y = 0; });
      window.addEventListener("scroll", function(){ var r = host.getBoundingClientRect(); state.scrollK = Math.max(-1, Math.min(1, -r.top / Math.max(1, r.height))); }, {passive: true});
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function(es){ es.forEach(function(e){ state.visible = e.isIntersecting; }); }).observe(host);

    var v = new THREE.Vector3();
    function project(obj){ obj.getWorldPosition(v); v.project(camera); return {x: (v.x + 1) / 2, y: (1 - v.y) / 2}; }

    function frame(now){
      requestAnimationFrame(frame);
      if (!state.visible || document.hidden) { state.last = now; return; }
      var dt = Math.min(0.05, (now - state.last) / 1000); state.last = now;
      if (opts.orbit) {
        if (!reduced) state.targetAngle += dt * 0.18;
        state.angle += (state.targetAngle + state.pointer.x * 0.9 - state.angle) * 0.06;
        var e = state.elev + state.pointer.y * -0.25 + state.scrollK * 0.35, radius = 7.2;
        camera.position.set(Math.sin(state.angle) * radius, 1.3 + e * 2.2, Math.cos(state.angle) * radius);
        camera.lookAt(0.2, 0.45, 0);
      } else {
        var cp = opts.cameraPos || [3.6, 3.3, 4.6], lk = opts.lookAt || [0.2, 0.3, 0];
        var f = camera.aspect < 1.45 ? 1.28 : 1.0;   // cadre plus large quand la boîte est haute (téléphone)
        camera.position.set(cp[0] * f, cp[1] * f, cp[2] * f); camera.lookAt(lk[0], lk[1], lk[2]);
      }
      var t = now / 1000;
      car.position.y = Math.sin(t * 2.1) * 0.006; reflection.position.y = -0.005 - car.position.y;
      built.wheels.forEach(function(w){ if (!w.userData.anim) { w.children[0].rotation.y += dt * 0.8; w.children[1].rotation.y += dt * 0.8; } });
      // animations de roues (pit stop)
      built.wheels.forEach(function(w){
        var a = w.userData.anim; if (!a) return;
        a.t += dt;
        var home = w.userData.home, side = home.z > 0 ? 1 : -1;
        if (a.phase === "off") {
          var k = Math.min(1, a.t / 0.35);
          w.position.set(home.x, home.y + k * 0.9 - k * k * 0.5, home.z + side * k * 1.4); w.rotation.x += dt * 9; w.scale.setScalar(1 - k * 0.6);
          if (k >= 1) { a.phase = "on"; a.t = 0; w.position.set(home.x, home.y + 0.6, home.z + side * 1.2); w.rotation.set(0, 0, 0); w.scale.setScalar(0.4); }
        } else if (a.phase === "on") {
          var k2 = Math.min(1, a.t / 0.3), ease = 1 - Math.pow(1 - k2, 3);
          w.position.set(home.x, home.y + (1 - ease) * 0.6, home.z + side * (1 - ease) * 1.2); w.scale.setScalar(0.4 + ease * 0.6);
          if (k2 >= 1) { w.position.copy(home); w.scale.setScalar(1); w.userData.anim = null; }
        }
      });
      if (opts.onFrame) opts.onFrame(project);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
    host.classList.add("ready");

    return {
      car: car, wheels: built.wheels, camera: camera, project: project,
      setColor: function(hex){ built.body.color.copy(srgb(hex)); reflection.traverse(function(o){ if (o.isMesh && o.material && o.material.color && o.material.metalness === 0.45) o.material.color.copy(srgb(hex)); }); },
      popWheel: function(i){ var w = built.wheels[i]; if (w && !w.userData.anim) w.userData.anim = {phase: "off", t: 0}; },
      resetWheels: function(){ built.wheels.forEach(function(w){ w.userData.anim = null; w.position.copy(w.userData.home); w.scale.setScalar(1); w.rotation.set(0, 0, 0); }); },
      setLamp: setLamp,
      setGantryLight: function(color, intensity){ if (gantryLight) { gantryLight.color.set(color); gantryLight.intensity = intensity; } }
    };
  }

  window.GP3D = {createScene: createScene, buildCar: buildCar};

  /* ---------- En-tête ---------- */
  var host = document.getElementById("stage3d");
  if (host) {
    var hero = createScene(host, {orbit: true, gantry: true, startLine: true});
    if (!hero) host.classList.add("no3d");
    else {
      var cols2d = document.querySelectorAll("#lights .lcol");
      function syncLights(){
        var anyGreen = false, reds = 0;
        cols2d.forEach(function(c, i){
          var l = c.querySelector(".light");
          var st = l.classList.contains("green") ? "green" : (l.classList.contains("red") ? "red" : "");
          hero.setLamp(i, st); if (st === "green") anyGreen = true; if (st === "red") reds++;
        });
        hero.setGantryLight(anyGreen ? 0x38f27a : 0xff2a3c, anyGreen ? 2.2 : reds * 0.35);
      }
      if (cols2d.length) { new MutationObserver(syncLights).observe(document.getElementById("lights"), {attributes: true, subtree: true, attributeFilter: ["class"]}); syncLights(); }
    }
  }

  /* ---------- Pit stop en 3D ---------- */
  var pitHost = document.getElementById("pit3d");
  if (pitHost) {
    var pitBox = document.getElementById("pit");
    var pit = createScene(pitHost, {orbit: false, gantry: false, startLine: false, fov: 30, fog: 0.03, cameraPos: [3.1, 2.6, 3.7], lookAt: [0.35, 0.2, 0],
      color: (pitBox && pitBox.style.color) || "#c8102e",
      onFrame: function(project){
        // place les cibles sur les roues : ordre des boutons = AR gauche, AR droite, AV gauche, AV droite
        var order = [0, 1, 2, 3];
        order.forEach(function(wi, bi){
          var b = pitHost.parentNode.querySelector('.wheel[data-w="' + bi + '"]'); if (!b) return;
          var p = project(pit.wheels[wi]);
          b.style.left = (p.x * 100).toFixed(2) + "%"; b.style.top = (p.y * 100).toFixed(2) + "%";
        });
      }});
    if (!pit) pitHost.classList.add("no3d");
    else {
      pitHost.classList.add("ready");
      var svgCar = pitBox && pitBox.querySelector(".pit-car"); if (svgCar) svgCar.style.display = "none";
      document.querySelectorAll("#pit .wheel").forEach(function(b){ b.addEventListener("pointerdown", function(){ if (!b.disabled && !b.classList.contains("done")) pit.popWheel(parseInt(b.getAttribute("data-w"), 10)); }); });
      var rst = document.getElementById("pit-reset"), go = document.getElementById("pit-go");
      if (rst) rst.addEventListener("click", function(){ pit.resetWheels(); });
      if (go) go.addEventListener("click", function(){ pit.resetWheels(); });
      // couleur de l'écurie choisie
      if (pitBox) new MutationObserver(function(){ var c = pitBox.style.color; if (c) pit.setColor(c); }).observe(pitBox, {attributes: true, attributeFilter: ["style"]});
    }
  }
})();
