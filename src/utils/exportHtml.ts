/**
 * Standalone single index.html with interactive hands-on lab mode,
 * dynamic water flow, droplet particles, and observation notes.
 */

export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>중1 수학: 기둥과 뿔의 부피 관계 (3D 실험실)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Three.js & OrbitControls via CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <style>
    body { margin: 0; overflow: hidden; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif; }
    #canvas-container { width: 100vw; height: 100vh; position: absolute; top: 0; left: 0; }
  </style>
</head>
<body class="text-white select-none">
  <div id="canvas-container"></div>

  <!-- Top Educational Header -->
  <header class="absolute top-4 inset-x-4 md:inset-x-8 z-20 pointer-events-none flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
    <div class="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl max-w-xl">
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
          중학교 1학년 수학 탐구
        </span>
        <span id="badge-stage" class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
          직접 실험 모드
        </span>
      </div>
      <h1 id="header-title" class="text-base md:text-lg font-bold text-white tracking-tight">
        기둥과 뿔의 부피 관계 직접 실험하기
      </h1>
      <p id="header-desc" class="text-xs md:text-sm text-slate-300 mt-0.5 leading-relaxed">
        뿔 용기에 물을 채우고, 레버를 조절해 기둥으로 직접 쏟아 부어보세요!
      </p>
    </div>

    <div class="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2 text-xs">
      <span class="text-slate-400">기둥 눈금 높이:</span>
      <span id="cyl-ratio-text" class="font-mono font-bold text-emerald-400 text-sm">0%</span>
      <span id="cyl-eval-text" class="text-slate-400">(관찰 중)</span>
    </div>
  </header>

  <!-- Bottom Interactive Control Dock -->
  <div class="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-3 pointer-events-none">
    <div class="pointer-events-auto bg-slate-900/95 border border-slate-700/90 rounded-2xl p-4 shadow-2xl backdrop-blur-lg flex flex-col gap-3">
      
      <!-- Top Row Controls -->
      <div class="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-800 text-xs">
        <!-- Shape -->
        <div class="flex items-center gap-1.5">
          <label class="font-bold text-slate-300">도형:</label>
          <select id="shape-select" class="bg-slate-950 text-white font-semibold px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none">
            <option value="cylinder_cone">① 원기둥 & 원뿔</option>
            <option value="prism_pyramid">② 각기둥 & 사각뿔</option>
          </select>
        </div>

        <!-- Liquid -->
        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button id="btn-water" class="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold">💧 물</button>
          <button id="btn-sand" class="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white font-semibold">🏖️ 모래</button>
        </div>

        <!-- Reset -->
        <button id="btn-reset" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 ml-auto transition">
          ↺ 처음으로 리셋
        </button>
      </div>

      <!-- Hands-on Lab Controls -->
      <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <button id="btn-fill" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md transition active:scale-95">
            💧 1. 뿔에 물 가득 채우기
          </button>
          <span id="cone-remaining-text" class="font-mono text-sky-400 font-bold">
            뿔 잔여량: 0%
          </span>
        </div>

        <!-- Tilt slider & Hold button -->
        <div class="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
          <div class="flex justify-between text-slate-300">
            <span class="font-semibold text-amber-300">2. 뿔 용기 기울이기 레버 (직접 쏟아붓기)</span>
            <span id="tilt-deg-text" class="font-mono font-bold text-sky-400">0°</span>
          </div>
          <input id="tilt-slider" type="range" min="0" max="1" step="0.01" value="0" class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          <div class="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0° (세움)</span>
            <span>25° (물 흐르기 시작)</span>
            <span>70° (강한 물줄기)</span>
            <span>105° (완전히 다 쏟음)</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button id="btn-hold-pour" class="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow select-none">
            🖐️ 꾹 눌러서 물 붓기 (Hold to Pour)
          </button>
          <button id="btn-stand-up" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold">
            세우기
          </button>
        </div>
      </div>

      <!-- Formula Note -->
      <div class="p-2.5 rounded-xl bg-sky-950/50 border border-sky-800/40 text-center text-xs">
        <span class="font-extrabold text-amber-300 font-mono">
          [발견한 공식] 뿔의 부피 = 1/3 × (기둥의 부피) = 1/3 × (밑넓이 S) × (높이 h)
        </span>
      </div>
    </div>
  </div>

  <script>
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 18, 42);

    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 4.8, 11.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.localClippingEnabled = true;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.target.set(0, 1.8, 0);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    fillLight.position.set(-6, 5, -4);
    scene.add(fillLight);

    // Table
    const tableGeo = new THREE.CylinderGeometry(7.2, 7.2, 0.4, 64);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.15 });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.y = -0.2;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    const H = 3.6;
    const R_CYL = 1.35;
    const W_PRISM = 2.4;
    const PRISM_POS_X = 1.8;
    const CONE_REST_X = -2.0;

    let shapeType = 'cylinder_cone';
    let liquidType = 'water';
    let coneFill = 0;
    let cylFillH = 0;
    let manualTilt = 0;
    let smoothedTilt = 0;
    let isFilling = false;

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.65 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, transparent: true, opacity: 0.82 });
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85, transparent: true, opacity: 0.95 });

    function getFluidMat() { return liquidType === 'water' ? waterMat : sandMat; }

    function createGradTexture() {
      const cvs = document.createElement('canvas');
      cvs.width = 512; cvs.height = 1024;
      const ctx = cvs.getContext('2d');
      ctx.clearRect(0, 0, 512, 1024);
      const padY = 50, usableH = 1024 - padY * 2;
      const lineX = 350;

      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(lineX, padY); ctx.lineTo(lineX, padY + usableH); ctx.stroke();

      const marks = [
        { r: 1/3, text: '1/3', col: '#38bdf8' },
        { r: 2/3, text: '2/3', col: '#818cf8' },
        { r: 3/3, text: '3/3 (가득)', col: '#4ade80' }
      ];

      marks.forEach(m => {
        const y = padY + usableH * (1 - m.r);
        ctx.strokeStyle = m.col; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(lineX - 35, y); ctx.lineTo(lineX + 35, y); ctx.stroke();
        ctx.fillStyle = m.col;
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(m.text, lineX - 45, y);
      });
      return new THREE.CanvasTexture(cvs);
    }

    // Kinematic Groups
    const prismGroup = new THREE.Group();
    prismGroup.position.set(PRISM_POS_X, 0, 0);
    scene.add(prismGroup);

    const coneRig = new THREE.Group();
    coneRig.position.set(CONE_REST_X, 0, 0);
    scene.add(coneRig);

    const standRig = new THREE.Group();
    standRig.position.set(CONE_REST_X, 0, 0);
    scene.add(standRig);

    const spoutPivot = new THREE.Group();
    coneRig.add(spoutPivot);

    const vesselOffsetGroup = new THREE.Group();
    spoutPivot.add(vesselOffsetGroup);

    // Dynamic stream & droplets
    const streamCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    );
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88
    });
    const streamMesh = new THREE.Mesh(new THREE.TubeGeometry(streamCurve, 16, 0.05, 8, false), streamMat);
    streamMesh.visible = false;
    scene.add(streamMesh);

    // Droplets
    const MAX_DROPLETS = 60;
    const dropletGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const dropletMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    const dropletInstances = new THREE.InstancedMesh(dropletGeo, dropletMat, MAX_DROPLETS);
    scene.add(dropletInstances);

    const droplets = [];
    const _dMat = new THREE.Matrix4();
    for (let i = 0; i < MAX_DROPLETS; i++) {
      droplets.push({ active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 });
      _dMat.makeTranslation(0, -999, 0);
      dropletInstances.setMatrixAt(i, _dMat);
    }
    dropletInstances.instanceMatrix.needsUpdate = true;

    let prismGlass, prismFluid, pyrGlass, pyrFluid;

    function buildShapes() {
      while(prismGroup.children.length > 0) prismGroup.remove(prismGroup.children[0]);
      while(vesselOffsetGroup.children.length > 0) vesselOffsetGroup.remove(vesselOffsetGroup.children[0]);
      while(standRig.children.length > 0) standRig.remove(standRig.children[0]);

      const isCyl = shapeType === 'cylinder_cone';
      const spoutRadius = isCyl ? R_CYL : W_PRISM / 2;
      const apexY = 0.35;
      const topRimY = apexY + H;

      spoutPivot.position.set(spoutRadius, topRimY, 0);
      spoutPivot.rotation.set(0, 0, 0);
      vesselOffsetGroup.position.set(-spoutRadius, -topRimY, 0);

      // 1. 기둥
      if (isCyl) {
        const geo = new THREE.CylinderGeometry(R_CYL, R_CYL, H, 48, 1, true);
        geo.translate(0, H/2, 0);
        prismGlass = new THREE.Mesh(geo, glassMat);
        prismGroup.add(prismGlass);

        const fGeo = new THREE.CylinderGeometry(R_CYL*0.98, R_CYL*0.98, 1, 48);
        fGeo.translate(0, 0.5, 0);
        prismFluid = new THREE.Mesh(fGeo, getFluidMat());
        prismFluid.scale.set(1, 0.001, 1);
        prismGroup.add(prismFluid);
      } else {
        const geo = new THREE.BoxGeometry(W_PRISM, H, W_PRISM);
        geo.translate(0, H/2, 0);
        prismGlass = new THREE.Mesh(geo, glassMat);
        prismGroup.add(prismGlass);

        const fGeo = new THREE.BoxGeometry(W_PRISM*0.98, 1, W_PRISM*0.98);
        fGeo.translate(0, 0.5, 0);
        prismFluid = new THREE.Mesh(fGeo, getFluidMat());
        prismFluid.scale.set(1, 0.001, 1);
        prismGroup.add(prismFluid);
      }

      // Graduation
      const gGeo = new THREE.PlaneGeometry(1.6, H);
      gGeo.translate(0, H/2, (isCyl ? R_CYL : W_PRISM/2) + 0.02);
      prismGroup.add(new THREE.Mesh(gGeo, new THREE.MeshBasicMaterial({ map: createGradTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false })));

      // 2. 뿔
      if (isCyl) {
        const cGeo = new THREE.CylinderGeometry(R_CYL, 0.02, H, 48, 1, true);
        cGeo.translate(0, apexY + H/2, 0);
        pyrGlass = new THREE.Mesh(cGeo, glassMat);
        vesselOffsetGroup.add(pyrGlass);

        const beakGeo = new THREE.ConeGeometry(0.18, 0.35, 16);
        beakGeo.rotateZ(-Math.PI/2);
        beakGeo.translate(R_CYL + 0.12, topRimY, 0);
        vesselOffsetGroup.add(new THREE.Mesh(beakGeo, rimMat));

        const cfGeo = new THREE.CylinderGeometry(R_CYL*0.98, 0.015, H, 48);
        cfGeo.translate(0, apexY + H/2, 0);
        pyrFluid = new THREE.Mesh(cfGeo, getFluidMat());
        pyrFluid.scale.set(0.001, 0.001, 0.001);
        vesselOffsetGroup.add(pyrFluid);

        const sRing = new THREE.Mesh(new THREE.TorusGeometry(R_CYL * 0.7, 0.04, 16, 32), rimMat);
        sRing.rotation.x = Math.PI / 2;
        sRing.position.y = apexY + H * 0.35;
        standRig.add(sRing);
      } else {
        const pGeo = new THREE.CylinderGeometry(W_PRISM/Math.SQRT2, 0.02, H, 4, 1, true);
        pGeo.rotateY(Math.PI/4);
        pGeo.translate(0, apexY + H/2, 0);
        pyrGlass = new THREE.Mesh(pGeo, glassMat);
        vesselOffsetGroup.add(pyrGlass);

        const beakGeo = new THREE.ConeGeometry(0.18, 0.35, 16);
        beakGeo.rotateZ(-Math.PI/2);
        beakGeo.translate(W_PRISM/2 + 0.12, topRimY, 0);
        vesselOffsetGroup.add(new THREE.Mesh(beakGeo, rimMat));

        const pfGeo = new THREE.CylinderGeometry(W_PRISM*0.98/Math.SQRT2, 0.015, H, 4);
        pfGeo.rotateY(Math.PI/4);
        pfGeo.translate(0, apexY + H/2, 0);
        pyrFluid = new THREE.Mesh(pfGeo, getFluidMat());
        pyrFluid.scale.set(0.001, 0.001, 0.001);
        vesselOffsetGroup.add(pyrFluid);

        const sRing = new THREE.Mesh(new THREE.TorusGeometry(W_PRISM * 0.45, 0.04, 16, 4), rimMat);
        sRing.rotation.x = Math.PI / 2;
        sRing.position.y = apexY + H * 0.35;
        standRig.add(sRing);
      }
    }
    buildShapes();

    // Loop
    let lastT = performance.now();
    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastT)/1000, 0.1);
      lastT = now;

      const isCyl = shapeType === 'cylinder_cone';
      const spoutRadius = isCyl ? R_CYL : W_PRISM / 2;
      const topRimY = 0.35 + H;
      const restSpoutX = CONE_REST_X + spoutRadius;
      const restSpoutY = topRimY;
      const pourSpoutTargetX = PRISM_POS_X - spoutRadius * 0.35;
      const pourSpoutTargetY = H + 0.85;

      if (isFilling) {
        coneFill = Math.min(1, coneFill + dt * 1.5);
        if (coneFill >= 1) isFilling = false;
      }

      smoothedTilt = THREE.MathUtils.damp(smoothedTilt, manualTilt, 10, dt);

      let curSpoutX = restSpoutX;
      let curSpoutY = restSpoutY;
      let curTilt = 0;
      let isStreaming = false;

      if (smoothedTilt < 0.2) {
        const t = smoothedTilt / 0.2;
        const ease = t * t * (3 - 2 * t);
        curSpoutX = THREE.MathUtils.lerp(restSpoutX, pourSpoutTargetX, ease);
        curSpoutY = THREE.MathUtils.lerp(restSpoutY, pourSpoutTargetY, ease);
      } else {
        curSpoutX = pourSpoutTargetX;
        curSpoutY = pourSpoutTargetY;
        const p = (smoothedTilt - 0.2) / 0.8;
        curTilt = p * 1.85;

        if (p > 0.08 && coneFill > 0.001) {
          const flow = Math.min(1, (p - 0.08) * 1.5);
          isStreaming = true;
          const drain = Math.min(coneFill, dt * 0.45 * flow);
          coneFill -= drain;
          cylFillH = Math.min(H, cylFillH + drain * (H / 3));
        }
      }

      coneRig.position.set(curSpoutX - spoutRadius, curSpoutY - topRimY, 0);
      spoutPivot.rotation.z = -curTilt;

      // Stream & particles
      if (isStreaming) {
        streamMesh.visible = true;
        const spoutW = new THREE.Vector3(0, 0, 0);
        spoutPivot.localToWorld(spoutW);
        spoutW.x += 0.12;

        const targetW = new THREE.Vector3(PRISM_POS_X, cylFillH + 0.02, 0);
        streamCurve.v0.copy(spoutW);
        streamCurve.v1.set((spoutW.x + targetW.x)/2 + 0.05, spoutW.y - 0.25, 0);
        streamCurve.v2.copy(targetW);
        streamMesh.geometry.dispose();
        streamMesh.geometry = new THREE.TubeGeometry(streamCurve, 16, 0.05, 8, false);

        for (let i = 0; i < 2; i++) {
          const d = droplets.find(dp => !dp.active);
          if (d) {
            d.active = true;
            d.x = spoutW.x + (Math.random()-0.5)*0.06;
            d.y = spoutW.y - 0.02;
            d.z = (Math.random()-0.5)*0.08;
            d.vx = (PRISM_POS_X - spoutW.x)*1.2 + (Math.random()-0.5)*0.3;
            d.vy = -0.6;
            d.vz = 0;
            d.life = 0;
          }
        }
      } else {
        streamMesh.visible = false;
      }

      droplets.forEach((d, idx) => {
        if (d.active) {
          d.life += dt;
          d.vy -= 12.0 * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.y <= cylFillH || d.life > 0.6) {
            d.active = false;
            _dMat.makeTranslation(0, -999, 0);
          } else {
            _dMat.makeTranslation(d.x, d.y, d.z);
          }
        } else {
          _dMat.makeTranslation(0, -999, 0);
        }
        dropletInstances.setMatrixAt(idx, _dMat);
      });
      dropletInstances.instanceMatrix.needsUpdate = true;

      // Update fluid meshes
      if (pyrFluid) {
        const s = Math.max(0.001, Math.cbrt(coneFill));
        pyrFluid.scale.set(s, s, s);
        pyrFluid.visible = coneFill > 0.005;
      }
      if (prismFluid) {
        prismFluid.scale.y = Math.max(0.001, cylFillH);
        prismFluid.visible = cylFillH > 0.01;
      }

      // UI updates
      document.getElementById('cone-remaining-text').innerText = '뿔 잔여량: ' + Math.round(coneFill * 100) + '%';
      const ratio = cylFillH / H;
      document.getElementById('cyl-ratio-text').innerText = Math.round(ratio * 100) + '%';
      const evalEl = document.getElementById('cyl-eval-text');
      if (ratio >= 0.31 && ratio <= 0.35) evalEl.innerText = '(★ 1/3 높이 도달!)';
      else if (ratio >= 0.64 && ratio <= 0.68) evalEl.innerText = '(★ 2/3 높이 도달!)';
      else if (ratio >= 0.95) evalEl.innerText = '(★ 3/3 가득 참!)';
      else evalEl.innerText = '(관찰 중)';

      document.getElementById('tilt-deg-text').innerText = Math.round(smoothedTilt * 105) + '°';

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Event handlers
    document.getElementById('btn-fill').addEventListener('click', () => {
      manualTilt = 0;
      document.getElementById('tilt-slider').value = 0;
      isFilling = true;
    });

    const tiltSlider = document.getElementById('tilt-slider');
    tiltSlider.addEventListener('input', (e) => {
      manualTilt = parseFloat(e.target.value);
    });

    let holdTimer = null;
    const btnHold = document.getElementById('btn-hold-pour');
    const startHold = () => {
      if (holdTimer) clearInterval(holdTimer);
      holdTimer = setInterval(() => {
        manualTilt = Math.min(1, manualTilt + 0.04);
        tiltSlider.value = manualTilt;
      }, 30);
    };
    const endHold = () => {
      if (holdTimer) clearInterval(holdTimer);
      holdTimer = null;
    };
    btnHold.addEventListener('mousedown', startHold);
    btnHold.addEventListener('mouseup', endHold);
    btnHold.addEventListener('touchstart', startHold);
    btnHold.addEventListener('touchend', endHold);

    document.getElementById('btn-stand-up').addEventListener('click', () => {
      manualTilt = 0;
      tiltSlider.value = 0;
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      coneFill = 0; cylFillH = 0; manualTilt = 0; smoothedTilt = 0; isFilling = false;
      tiltSlider.value = 0;
      coneRig.position.set(CONE_REST_X, 0, 0);
      spoutPivot.rotation.set(0, 0, 0);
    });

    document.getElementById('shape-select').addEventListener('change', (e) => {
      shapeType = e.target.value;
      coneFill = 0; cylFillH = 0; manualTilt = 0; smoothedTilt = 0; isFilling = false;
      tiltSlider.value = 0;
      buildShapes();
    });

    document.getElementById('btn-water').addEventListener('click', () => {
      liquidType = 'water';
      document.getElementById('btn-water').className = 'px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold';
      document.getElementById('btn-sand').className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white font-semibold';
      streamMat.color.setHex(0x38bdf8);
      dropletMat.color.setHex(0x38bdf8);
      if (prismFluid) prismFluid.material = getFluidMat();
      if (pyrFluid) pyrFluid.material = getFluidMat();
    });

    document.getElementById('btn-sand').addEventListener('click', () => {
      liquidType = 'sand';
      document.getElementById('btn-sand').className = 'px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold';
      document.getElementById('btn-water').className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white font-semibold';
      streamMat.color.setHex(0xd97706);
      dropletMat.color.setHex(0xd97706);
      if (prismFluid) prismFluid.material = getFluidMat();
      if (pyrFluid) pyrFluid.material = getFluidMat();
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`;
}
