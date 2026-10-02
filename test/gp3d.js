/* Grand Prix de nos 30 ans : scène 3D de l'en-tête (three.js r128, UMD). Monoplace low-poly originale, portique de feux, sol réfléchissant. */
(function(){
  if (typeof THREE === "undefined") return;
  var host = document.getElementById("stage3d");
  if (!host) return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.createElement("canvas");
  var gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!gl) { host.classList.add("no3d"); return; }

  var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(canvas);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0f0d0c, 0.055);
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  /* Lumières */
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x16100c, 0.55));
  var key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(4, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.bias = -0.0005;
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xffd9c2, 0.35); fill.position.set(-6, 3, -2); scene.add(fill);
  var rim = new THREE.SpotLight(0xff3b4d, 1.2, 30, Math.PI / 5, 0.6, 1); rim.position.set(-2, 4, -7); scene.add(rim);
  var redGlow = new THREE.PointLight(0xc8102e, 0.9, 12, 2); redGlow.position.set(0, 0.6, -3); scene.add(redGlow);

  /* Sol : asphalte avec ligne d'arrivée, légèrement réfléchissant */
  function asphaltTexture(){
    var c = document.createElement("canvas"); c.width = 1024; c.height = 1024; var x = c.getContext("2d");
    x.fillStyle = "#0e0c0a"; x.fillRect(0, 0, 1024, 1024);
    var img = x.getImageData(0, 0, 1024, 1024), d = img.data;
    for (var i = 0; i < d.length; i += 4) { var n = (Math.random() * 14) | 0; d[i] += n; d[i+1] += n * 0.9; d[i+2] += n * 0.8; }
    x.putImageData(img, 0, 0);
    // ligne d'arrivée en damier au centre
    for (var r = 0; r < 2; r++) for (var k = 0; k < 32; k++) { x.fillStyle = (k + r) % 2 ? "#efe7d8" : "#151210"; x.fillRect(484 + r * 28, k * 32, 28, 32); }
    // bandes latérales rouge / blanc (vibreurs) sur les bords
    for (var j = 0; j < 32; j++) { x.fillStyle = j % 2 ? "#c8102e" : "#efe7d8"; x.fillRect(0, j * 32, 22, 32); x.fillRect(1002, j * 32, 22, 32); }
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  function fadeAlpha(){
    var c = document.createElement("canvas"); c.width = c.height = 512; var x = c.getContext("2d");
    var g = x.createRadialGradient(256, 256, 60, 256, 256, 256); g.addColorStop(0, "#fff"); g.addColorStop(0.55, "#ddd"); g.addColorStop(1, "#000");
    x.fillStyle = g; x.fillRect(0, 0, 512, 512); return new THREE.CanvasTexture(c);
  }
  var floorMat = new THREE.MeshStandardMaterial({map: asphaltTexture(), alphaMap: fadeAlpha(), roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.9});
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  /* Matériaux */
  var teamColor = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--red").trim() || "#c8102e").convertSRGBToLinear();
  var body = new THREE.MeshStandardMaterial({color: teamColor, metalness: 0.45, roughness: 0.32});
  var carbon = new THREE.MeshStandardMaterial({color: 0x15151a, metalness: 0.7, roughness: 0.42});
  var tyre = new THREE.MeshStandardMaterial({color: 0x0d0d0d, metalness: 0.1, roughness: 0.92});
  var rimMat = new THREE.MeshStandardMaterial({color: 0x9a9aa0, metalness: 0.95, roughness: 0.25});
  var cream = new THREE.MeshStandardMaterial({color: new THREE.Color(0xefe7d8).convertSRGBToLinear(), metalness: 0.2, roughness: 0.4});
  var yellow = new THREE.MeshStandardMaterial({color: new THREE.Color(0xf5c518).convertSRGBToLinear(), metalness: 0.2, roughness: 0.5});
  var glass = new THREE.MeshStandardMaterial({color: 0x101418, metalness: 0.9, roughness: 0.1});

  function box(w, h, d, mat, x, y, z){ var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; return m; }

  /* Monoplace : axe X = avant, Z = largeur */
  var car = new THREE.Group();
  // fond plat
  car.add(box(3.2, 0.05, 1.5, carbon, 0.1, 0.12, 0));
  // coque centrale (effilée vers l'avant par plusieurs segments)
  var tub = box(1.6, 0.34, 0.52, body, -0.2, 0.33, 0); car.add(tub);
  var tubFront = box(0.9, 0.26, 0.4, body, 1.0, 0.32, 0); car.add(tubFront);
  // museau conique
  var nose = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 1.1, 20), body); nose.rotation.z = -Math.PI / 2; nose.position.set(1.95, 0.3, 0); nose.castShadow = true; car.add(nose);
  // capot moteur et prise d'air
  var cover = box(1.3, 0.3, 0.42, body, -0.85, 0.5, 0); car.add(cover);
  var airbox = box(0.42, 0.26, 0.34, body, -0.2, 0.72, 0); car.add(airbox);
  var intake = box(0.08, 0.16, 0.22, carbon, 0.02, 0.74, 0); car.add(intake);
  // aileron de requin
  car.add(box(1.0, 0.3, 0.02, carbon, -1.1, 0.78, 0));
  // pontons
  [1, -1].forEach(function(s){
    var pod = box(1.5, 0.3, 0.42, body, -0.1, 0.3, s * 0.5); pod.castShadow = true; car.add(pod);
    car.add(box(0.1, 0.22, 0.3, carbon, 0.66, 0.32, s * 0.5));           // entrée d'air
    car.add(box(0.5, 0.06, 0.2, carbon, 0.95, 0.2, s * 0.62));            // bargeboard
    car.add(box(0.1, 0.06, 0.08, carbon, 0.55, 0.6, s * 0.32));           // rétroviseur
  });
  // cockpit, halo, casque
  var cockpit = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 20), carbon); cockpit.position.set(0.25, 0.5, 0); car.add(cockpit);
  var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), cream); helmet.position.set(0.22, 0.62, 0); helmet.castShadow = true; car.add(helmet);
  var visor = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 16, Math.PI * 1.75, Math.PI * 0.5, Math.PI * 0.35, Math.PI * 0.3), glass); visor.position.copy(helmet.position); car.add(visor);
  var haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.028, 10, 40, Math.PI), carbon); haloRing.rotation.x = Math.PI / 2; haloRing.rotation.z = Math.PI / 2; haloRing.position.set(0.25, 0.7, 0); car.add(haloRing);
  var haloPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.34, 10), carbon); haloPillar.rotation.z = Math.PI / 2.6; haloPillar.position.set(0.56, 0.62, 0); car.add(haloPillar);
  // aileron avant : 3 éléments + dérives
  car.add(box(0.36, 0.03, 1.9, body, 2.45, 0.14, 0));
  var fl2 = box(0.22, 0.025, 1.7, carbon, 2.28, 0.2, 0); fl2.rotation.z = 0.25; car.add(fl2);
  var fl3 = box(0.14, 0.02, 1.5, body, 2.16, 0.27, 0); fl3.rotation.z = 0.45; car.add(fl3);
  [1, -1].forEach(function(s){ car.add(box(0.6, 0.26, 0.03, carbon, 2.35, 0.26, s * 0.95)); });
  // aileron arrière : plan principal, volet DRS, dérives, supports
  car.add(box(0.34, 0.03, 1.1, body, -1.75, 0.82, 0));
  var drs = box(0.18, 0.025, 1.05, carbon, -1.9, 0.9, 0); drs.rotation.z = -0.35; car.add(drs);
  [1, -1].forEach(function(s){ car.add(box(0.7, 0.4, 0.03, carbon, -1.72, 0.72, s * 0.56)); });
  car.add(box(0.06, 0.4, 0.04, carbon, -1.62, 0.6, 0));
  car.add(box(0.5, 0.12, 0.6, carbon, -1.7, 0.2, 0)); // diffuseur
  // roues
  var wheels = [];
  function wheel(x, z, r, w){
    var g = new THREE.Group();
    var t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 36), tyre); t.rotation.x = Math.PI / 2; t.castShadow = true; g.add(t);
    var rimDisc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.01, 24), rimMat); rimDisc.rotation.x = Math.PI / 2; g.add(rimDisc);
    var stripe = new THREE.Mesh(new THREE.TorusGeometry(r * 0.86, 0.012, 6, 48), yellow); stripe.position.z = (z > 0 ? 1 : -1) * (w / 2 + 0.002); g.add(stripe);
    var stripe2 = stripe.clone(); stripe2.position.z = -stripe.position.z; g.add(stripe2);
    g.position.set(x, r, z); wheels.push(g); return g;
  }
  car.add(wheel(-1.15, 0.78, 0.36, 0.42)); car.add(wheel(-1.15, -0.78, 0.36, 0.42));
  car.add(wheel(1.5, 0.74, 0.33, 0.32)); car.add(wheel(1.5, -0.74, 0.33, 0.32));
  // suspensions
  function arm(x1, y1, z1, x2, y2, z2){
    var a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), len = a.distanceTo(b);
    var m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 8), carbon);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m;
  }
  [1, -1].forEach(function(s){
    car.add(arm(1.5, 0.42, s * 0.52, 1.3, 0.4, s * 0.2)); car.add(arm(1.5, 0.42, s * 0.52, 1.7, 0.36, s * 0.2)); car.add(arm(1.5, 0.22, s * 0.52, 1.5, 0.2, s * 0.2));
    car.add(arm(-1.15, 0.46, s * 0.55, -0.9, 0.44, s * 0.25)); car.add(arm(-1.15, 0.46, s * 0.55, -1.4, 0.4, s * 0.25)); car.add(arm(-1.15, 0.24, s * 0.55, -1.1, 0.22, s * 0.25));
  });
  // numéro 30 sur le capot (texture canvas)
  (function(){
    var c = document.createElement("canvas"); c.width = 256; c.height = 128; var x = c.getContext("2d");
    x.fillStyle = "rgba(0,0,0,0)"; x.clearRect(0, 0, 256, 128);
    x.fillStyle = "#efe7d8"; x.font = "900 96px 'Barlow Condensed', Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("30", 128, 66);
    var t = new THREE.CanvasTexture(c); var m = new THREE.MeshBasicMaterial({map: t, transparent: true});
    var p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), m); p.rotation.x = -Math.PI / 2; p.rotation.z = -Math.PI / 2; p.position.set(-0.75, 0.655, 0); car.add(p);
  })();
  car.position.y = 0.0;
  scene.add(car);
  // reflet au sol : copie inversée, translucide
  var reflection = car.clone(true);
  reflection.traverse(function(o){ if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.16; o.castShadow = false; o.receiveShadow = false; } });
  reflection.scale.y = -1; reflection.position.y = -0.005; scene.add(reflection);
  // ombre douce supplémentaire sous la voiture
  var blob = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0.35}));
  blob.rotation.x = -Math.PI / 2; blob.scale.set(1.25, 0.55, 1); blob.position.set(0.15, 0.002, 0); scene.add(blob);

  /* Portique de feux au-dessus de la ligne */
  var gantry = new THREE.Group();
  gantry.add(box(0.12, 0.12, 7.2, carbon, 0, 3.1, 0));
  [1, -1].forEach(function(s){ var post = box(0.1, 3.2, 0.1, carbon, 0, 1.55, s * 3.55); post.castShadow = false; gantry.add(post); });
  var lamps = [];
  for (var i = 0; i < 5; i++) {
    var panel = box(0.12, 0.62, 0.3, carbon, 0, 2.7, (i - 2) * 0.7); panel.castShadow = false; gantry.add(panel);
    var col = [];
    for (var r = 0; r < 2; r++) {
      var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshStandardMaterial({color: 0x2a1c1c, emissive: 0x000000, emissiveIntensity: 1, roughness: 0.3}));
      lamp.position.set(0.08, 2.85 - r * 0.3, (i - 2) * 0.7); gantry.add(lamp); col.push(lamp);
    }
    lamps.push(col);
  }
  gantry.position.x = 3.6; scene.add(gantry);
  var gantryLight = new THREE.PointLight(0xff2a3c, 0, 9, 2); gantryLight.position.set(3.4, 2.6, 0); scene.add(gantryLight);
  function setLamp(i, state){
    lamps[i].forEach(function(l){
      if (state === "red") { l.material.color.set(0xff2a3c); l.material.emissive.set(0xff2a3c); }
      else if (state === "green") { l.material.color.set(0x38f27a); l.material.emissive.set(0x38f27a); }
      else { l.material.color.set(0x2a1c1c); l.material.emissive.set(0x000000); }
    });
  }
  // miroir des feux 2D de la page : même séquence, même timing
  var cols2d = document.querySelectorAll("#lights .lcol");
  function syncLights(){
    var anyGreen = false, reds = 0;
    cols2d.forEach(function(c, i){
      var l = c.querySelector(".light");
      var st = l.classList.contains("green") ? "green" : (l.classList.contains("red") ? "red" : "");
      setLamp(i, st); if (st === "green") anyGreen = true; if (st === "red") reds++;
    });
    gantryLight.color.set(anyGreen ? 0x38f27a : 0xff2a3c); gantryLight.intensity = anyGreen ? 2.2 : reds * 0.35;
  }
  if (cols2d.length) { new MutationObserver(syncLights).observe(document.getElementById("lights"), {attributes: true, subtree: true, attributeFilter: ["class"]}); syncLights(); }

  /* Caméra : orbite lente + parallaxe pointeur + défilement */
  var angle = 0.9, targetAngle = 0.9, elev = 0.32, pointer = {x: 0, y: 0}, scrollK = 0, visible = true, last = performance.now();
  function resize(){
    var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener("resize", resize);
  host.addEventListener("pointermove", function(e){ var r = host.getBoundingClientRect(); pointer.x = (e.clientX - r.left) / r.width - 0.5; pointer.y = (e.clientY - r.top) / r.height - 0.5; });
  host.addEventListener("pointerleave", function(){ pointer.x = 0; pointer.y = 0; });
  window.addEventListener("scroll", function(){ var r = host.getBoundingClientRect(); scrollK = Math.max(-1, Math.min(1, -r.top / Math.max(1, r.height))); }, {passive: true});
  if ("IntersectionObserver" in window) new IntersectionObserver(function(es){ es.forEach(function(e){ visible = e.isIntersecting; }); }).observe(host);

  function frame(now){
    requestAnimationFrame(frame);
    if (!visible) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduced) targetAngle += dt * 0.18;
    angle += (targetAngle + pointer.x * 0.9 - angle) * 0.06;
    var e = elev + pointer.y * -0.25 + scrollK * 0.35;
    var radius = 7.2;
    camera.position.set(Math.sin(angle) * radius, 1.3 + e * 2.2, Math.cos(angle) * radius);
    camera.lookAt(0.2, 0.45, 0);
    // suspension et roues au ralenti
    var t = now / 1000;
    car.position.y = Math.sin(t * 2.1) * 0.006; reflection.position.y = -0.005 - Math.sin(t * 2.1) * 0.006;
    wheels.forEach(function(w){ w.children[0].rotation.y += dt * 0.8; w.children[1].rotation.y += dt * 0.8; });
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  host.classList.add("ready");
})();
