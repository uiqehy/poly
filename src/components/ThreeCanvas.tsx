import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ShapePair, LiquidType, ExperimentStage, ControlMode } from '../types';
import { sound } from '../utils/audio';

interface ThreeCanvasProps {
  shapePair: ShapePair;
  liquidType: LiquidType;
  stage: ExperimentStage;
  controlMode: ControlMode;
  manualTilt: number; // 0 (upright at stand) to 1 (fully tilted 105 deg over cylinder)
  animSpeed: number;
  pourCount: number;
  onStageChange: (nextStage: ExperimentStage) => void;
  onUpdateManualStats?: (coneRemainingPct: number, cylFillFraction: number) => void;
}

// Module-scope reusable objects to prevent GC
const _spoutWorld = new THREE.Vector3();
const _targetWorld = new THREE.Vector3();
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyScale = new THREE.Vector3();
const _clipNormal = new THREE.Vector3(0, -1, 0);

interface DropletParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  shapePair,
  liquidType,
  stage,
  controlMode,
  manualTilt,
  animSpeed,
  pourCount,
  onStageChange,
  onUpdateManualStats,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const propsRef = useRef({
    shapePair,
    liquidType,
    stage,
    controlMode,
    manualTilt,
    animSpeed,
    pourCount,
  });

  useEffect(() => {
    propsRef.current = {
      shapePair,
      liquidType,
      stage,
      controlMode,
      manualTilt,
      animSpeed,
      pourCount,
    };
  }, [shapePair, liquidType, stage, controlMode, manualTilt, animSpeed, pourCount]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Setup Renderer with Local Clipping for Physically Realistic Fluid Sloshing
    const width = container.clientWidth;
    const height = container.clientHeight;
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true; // Enables horizontal liquid surface inside tilted cone
    container.appendChild(renderer.domElement);

    // 3. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 18, 42);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 4.8, 11.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.minDistance = 4.5;
    controls.maxDistance = 22;
    controls.target.set(0, 1.8, 0);
    controlsRef.current = controls;

    // 4. Studio Environment Map
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {}

    // 5. Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.bias = -0.0005;
      const d = 7;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    fillLight.position.set(-6, 5, -4);
    scene.add(fillLight);

    // 6. Ground Laboratory Table
    const tableGroup = new THREE.Group();
    scene.add(tableGroup);

    const tableGeo = new THREE.CylinderGeometry(7.2, 7.2, 0.4, 64);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.15,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.y = -0.2;
    tableMesh.receiveShadow = !isSoftwareGl;
    tableGroup.add(tableMesh);

    // Soft contact shadow
    const shadowGeo = new THREE.PlaneGeometry(14, 14);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(128, 128, 15, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.005;
    tableGroup.add(shadowMesh);

    // Measurement guide rings on table
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x475569,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const leftRing = new THREE.Mesh(new THREE.RingGeometry(1.9, 1.95, 48), ringMat);
    leftRing.rotation.x = -Math.PI / 2;
    leftRing.position.set(-2.0, 0.01, 0);
    tableGroup.add(leftRing);

    const rightRing = new THREE.Mesh(new THREE.RingGeometry(1.9, 1.95, 48), ringMat.clone());
    rightRing.rotation.x = -Math.PI / 2;
    rightRing.position.set(1.8, 0.01, 0);
    tableGroup.add(rightRing);

    // ==========================================
    // 7. Dimensions & Materials
    // ==========================================
    const H = 3.6;
    const R_CYL = 1.35;
    const W_PRISM = 2.4;
    const PRISM_POS_X = 1.8;
    const CONE_REST_X = -2.0;

    // Glass material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      roughness: 0.06,
      metalness: 0.05,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.65,
    });

    // Fluid Materials
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // vivid clear educational cyan
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.82,
      depthWrite: true,
    });

    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // warm golden sand
      roughness: 0.85,
      metalness: 0.0,
      transparent: true,
      opacity: 0.95,
      depthWrite: true,
    });

    // Horizontal liquid clipping plane for tilted cone
    const fluidClipPlane = new THREE.Plane(_clipNormal, 4.5);
    waterMat.clippingPlanes = [fluidClipPlane];
    sandMat.clippingPlanes = [fluidClipPlane];

    const getFluidMat = () => (propsRef.current.liquidType === 'water' ? waterMat : sandMat);

    // Graduation Texture Generator
    function createGraduationTexture(isCylinder: boolean) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 512, 1024);

      const padY = 50;
      const usableH = 1024 - padY * 2;
      const lineX = isCylinder ? 330 : 380;

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lineX, padY);
      ctx.lineTo(lineX, padY + usableH);
      ctx.stroke();

      const marks = [
        { ratio: 1 / 3, label: '1/3', sub: '뿔 1개 분량', color: '#38bdf8' },
        { ratio: 2 / 3, label: '2/3', sub: '뿔 2개 분량', color: '#818cf8' },
        { ratio: 3 / 3, label: '3/3 (가득)', sub: '뿔 3개 분량', color: '#4ade80' },
      ];

      for (let i = 1; i < 9; i++) {
        if (i % 3 !== 0) {
          const tickY = padY + usableH * (1 - i / 9);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(lineX - 16, tickY);
          ctx.lineTo(lineX + 16, tickY);
          ctx.stroke();
        }
      }

      marks.forEach((m) => {
        const tickY = padY + usableH * (1 - m.ratio);
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(lineX - 35, tickY);
        ctx.lineTo(lineX + 35, tickY);
        ctx.stroke();

        ctx.fillStyle = m.color;
        ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.label, lineX - 45, tickY);

        ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(m.sub, lineX - 45, tickY + 28);
      });

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    }

    // ==========================================
    // Kinematic Groups
    // ==========================================
    // 1. 기둥 Group
    const prismGroup = new THREE.Group();
    prismGroup.position.set(PRISM_POS_X, 0, 0);
    scene.add(prismGroup);

    let prismGlassMesh: THREE.Mesh | null = null;
    let prismFluidMesh: THREE.Mesh | null = null;
    let prismGradMesh: THREE.Mesh | null = null;
    let prismRimMesh: THREE.Mesh | null = null;
    let prismBaseMesh: THREE.Mesh | null = null;
    const guideRingsGroup = new THREE.Group();
    prismGroup.add(guideRingsGroup);

    // 2. 뿔 Rig: coneRig -> spoutPivot -> vesselOffsetGroup
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

    let pyramidGlassMesh: THREE.Mesh | null = null;
    let pyramidFluidMesh: THREE.Mesh | null = null;
    let pyramidRimMesh: THREE.Mesh | null = null;

    // ==========================================
    // 8. Dynamic Water Particle System & Ripple Waves
    // ==========================================
    // Core curved water stream
    const streamCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    );
    const streamGeo = new THREE.TubeGeometry(streamCurve, 16, 0.048, 8, false);
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
    });
    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.visible = false;
    scene.add(streamMesh);

    // Instanced droplet particles (60 particles spraying and falling with gravity)
    const MAX_DROPLETS = 70;
    const dropletGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const dropletMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
    });
    const dropletInstances = new THREE.InstancedMesh(dropletGeo, dropletMat, MAX_DROPLETS);
    dropletInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(dropletInstances);

    const droplets: DropletParticle[] = [];
    for (let i = 0; i < MAX_DROPLETS; i++) {
      droplets.push({
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1.0,
        scale: 1.0,
      });
      _dummyPos.set(0, -999, 0);
      _dummyMatrix.makeTranslation(_dummyPos.x, _dummyPos.y, _dummyPos.z);
      dropletInstances.setMatrixAt(i, _dummyMatrix);
    }
    dropletInstances.instanceMatrix.needsUpdate = true;

    // Multiple concentric surface ripples
    const rippleCount = 3;
    const rippleGroup = new THREE.Group();
    prismGroup.add(rippleGroup);

    const ripples = Array.from({ length: rippleCount }, (_, idx) => {
      const geo = new THREE.RingGeometry(0.05, 0.12, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      rippleGroup.add(mesh);
      return { mesh, mat, age: idx * 0.33 };
    });

    // Function to build/rebuild shapes
    function rebuildShapes(type: ShapePair) {
      if (prismGlassMesh) prismGroup.remove(prismGlassMesh);
      if (prismFluidMesh) prismGroup.remove(prismFluidMesh);
      if (prismGradMesh) prismGroup.remove(prismGradMesh);
      if (prismRimMesh) prismGroup.remove(prismRimMesh);
      if (prismBaseMesh) prismGroup.remove(prismBaseMesh);
      while (guideRingsGroup.children.length > 0) {
        guideRingsGroup.remove(guideRingsGroup.children[0]);
      }

      while (vesselOffsetGroup.children.length > 0) {
        vesselOffsetGroup.remove(vesselOffsetGroup.children[0]);
      }
      while (standRig.children.length > 0) {
        standRig.remove(standRig.children[0]);
      }

      const isCylinder = type === 'cylinder_cone';
      const spoutRadius = isCylinder ? R_CYL : W_PRISM / 2;
      const apexY = 0.35;
      const topRimY = apexY + H;

      // Position pivot exactly at spout
      spoutPivot.position.set(spoutRadius, topRimY, 0);
      spoutPivot.rotation.set(0, 0, 0);
      vesselOffsetGroup.position.set(-spoutRadius, -topRimY, 0);

      // 1. Build 기둥
      if (isCylinder) {
        const cylGeo = new THREE.CylinderGeometry(R_CYL, R_CYL, H, 48, 1, true);
        cylGeo.translate(0, H / 2, 0);
        prismGlassMesh = new THREE.Mesh(cylGeo, glassMat);
        prismGroup.add(prismGlassMesh);

        const baseGeo = new THREE.CylinderGeometry(R_CYL * 1.05, R_CYL * 1.05, 0.08, 48);
        baseGeo.translate(0, 0.04, 0);
        prismBaseMesh = new THREE.Mesh(baseGeo, rimMat);
        prismGroup.add(prismBaseMesh);

        const rimGeo = new THREE.TorusGeometry(R_CYL, 0.045, 16, 48);
        rimGeo.rotateX(Math.PI / 2);
        rimGeo.translate(0, H, 0);
        prismRimMesh = new THREE.Mesh(rimGeo, rimMat);
        prismGroup.add(prismRimMesh);

        const gradGeo = new THREE.PlaneGeometry(1.6, H);
        gradGeo.translate(0, H / 2, R_CYL + 0.02);
        prismGradMesh = new THREE.Mesh(
          gradGeo,
          new THREE.MeshBasicMaterial({
            map: createGraduationTexture(true),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        prismGroup.add(prismGradMesh);

        [1 / 3, 2 / 3, 1].forEach((ratio, idx) => {
          const ringTorus = new THREE.TorusGeometry(R_CYL + 0.005, idx === 0 ? 0.025 : 0.015, 8, 48);
          ringTorus.rotateX(Math.PI / 2);
          ringTorus.translate(0, H * ratio, 0);
          const rMesh = new THREE.Mesh(
            ringTorus,
            new THREE.MeshBasicMaterial({
              color: idx === 0 ? 0x38bdf8 : 0x64748b,
              transparent: true,
              opacity: idx === 0 ? 0.95 : 0.45,
            })
          );
          guideRingsGroup.add(rMesh);
        });

        const fluidGeo = new THREE.CylinderGeometry(R_CYL * 0.98, R_CYL * 0.98, 1, 48);
        fluidGeo.translate(0, 0.5, 0);
        prismFluidMesh = new THREE.Mesh(fluidGeo, getFluidMat());
        prismFluidMesh.scale.set(1, 0.0001, 1);
        prismFluidMesh.position.set(0, 0.02, 0);
        prismGroup.add(prismFluidMesh);
      } else {
        const boxGeo = new THREE.BoxGeometry(W_PRISM, H, W_PRISM);
        boxGeo.translate(0, H / 2, 0);
        prismGlassMesh = new THREE.Mesh(boxGeo, glassMat);
        prismGroup.add(prismGlassMesh);

        const baseGeo = new THREE.BoxGeometry(W_PRISM * 1.05, 0.08, W_PRISM * 1.05);
        baseGeo.translate(0, 0.04, 0);
        prismBaseMesh = new THREE.Mesh(baseGeo, rimMat);
        prismGroup.add(prismBaseMesh);

        const edges = new THREE.EdgesGeometry(boxGeo);
        prismRimMesh = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 })
        ) as unknown as THREE.Mesh;
        prismGroup.add(prismRimMesh);

        const gradGeo = new THREE.PlaneGeometry(1.6, H);
        gradGeo.translate(0, H / 2, W_PRISM / 2 + 0.02);
        prismGradMesh = new THREE.Mesh(
          gradGeo,
          new THREE.MeshBasicMaterial({
            map: createGraduationTexture(false),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        prismGroup.add(prismGradMesh);

        [1 / 3, 2 / 3, 1].forEach((ratio, idx) => {
          const rectPts = [
            new THREE.Vector3(-W_PRISM / 2, H * ratio, W_PRISM / 2),
            new THREE.Vector3(W_PRISM / 2, H * ratio, W_PRISM / 2),
            new THREE.Vector3(W_PRISM / 2, H * ratio, -W_PRISM / 2),
            new THREE.Vector3(-W_PRISM / 2, H * ratio, -W_PRISM / 2),
            new THREE.Vector3(-W_PRISM / 2, H * ratio, W_PRISM / 2),
          ];
          const rectGeo = new THREE.BufferGeometry().setFromPoints(rectPts);
          const rLine = new THREE.Line(
            rectGeo,
            new THREE.LineBasicMaterial({
              color: idx === 0 ? 0x38bdf8 : 0x64748b,
              linewidth: idx === 0 ? 3 : 1,
            })
          );
          guideRingsGroup.add(rLine);
        });

        const fluidGeo = new THREE.BoxGeometry(W_PRISM * 0.98, 1, W_PRISM * 0.98);
        fluidGeo.translate(0, 0.5, 0);
        prismFluidMesh = new THREE.Mesh(fluidGeo, getFluidMat());
        prismFluidMesh.scale.set(1, 0.0001, 1);
        prismFluidMesh.position.set(0, 0.02, 0);
        prismGroup.add(prismFluidMesh);
      }

      // 2. Build 뿔
      if (isCylinder) {
        const coneGeo = new THREE.CylinderGeometry(R_CYL, 0.02, H, 48, 1, true);
        coneGeo.translate(0, apexY + H / 2, 0);
        pyramidGlassMesh = new THREE.Mesh(coneGeo, glassMat);
        vesselOffsetGroup.add(pyramidGlassMesh);

        const rimGeo = new THREE.TorusGeometry(R_CYL, 0.045, 16, 48);
        rimGeo.rotateX(Math.PI / 2);
        rimGeo.translate(0, topRimY, 0);
        pyramidRimMesh = new THREE.Mesh(rimGeo, rimMat);
        vesselOffsetGroup.add(pyramidRimMesh);

        // Pouring spout beak
        const beakGeo = new THREE.ConeGeometry(0.18, 0.35, 16);
        beakGeo.rotateZ(-Math.PI / 2);
        beakGeo.translate(R_CYL + 0.12, topRimY, 0);
        vesselOffsetGroup.add(new THREE.Mesh(beakGeo, rimMat));

        // Fluid inside cone
        const fluidGeo = new THREE.CylinderGeometry(R_CYL * 0.98, 0.015, H, 48);
        fluidGeo.translate(0, apexY + H / 2, 0);
        pyramidFluidMesh = new THREE.Mesh(fluidGeo, getFluidMat());
        pyramidFluidMesh.scale.set(0.0001, 0.0001, 0.0001);
        vesselOffsetGroup.add(pyramidFluidMesh);

        // Tripod Stand on left table
        const standRing = new THREE.Mesh(
          new THREE.TorusGeometry(R_CYL * 0.7, 0.04, 16, 32),
          rimMat
        );
        standRing.rotation.x = Math.PI / 2;
        standRing.position.y = apexY + H * 0.35;
        standRig.add(standRing);

        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3;
          const legGeo = new THREE.CylinderGeometry(0.035, 0.035, apexY + H * 0.35, 16);
          legGeo.translate(0, (apexY + H * 0.35) / 2, 0);
          const leg = new THREE.Mesh(legGeo, rimMat);
          leg.position.set(Math.cos(angle) * R_CYL * 0.7, 0, Math.sin(angle) * R_CYL * 0.7);
          standRig.add(leg);
        }
      } else {
        const pyrGeo = new THREE.CylinderGeometry(W_PRISM / Math.SQRT2, 0.02, H, 4, 1, true);
        pyrGeo.rotateY(Math.PI / 4);
        pyrGeo.translate(0, apexY + H / 2, 0);
        pyramidGlassMesh = new THREE.Mesh(pyrGeo, glassMat);
        vesselOffsetGroup.add(pyramidGlassMesh);

        const pyrEdges = new THREE.EdgesGeometry(pyrGeo);
        pyramidRimMesh = new THREE.LineSegments(
          pyrEdges,
          new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 })
        ) as unknown as THREE.Mesh;
        vesselOffsetGroup.add(pyramidRimMesh);

        const beakGeo = new THREE.ConeGeometry(0.18, 0.35, 16);
        beakGeo.rotateZ(-Math.PI / 2);
        beakGeo.translate(W_PRISM / 2 + 0.12, topRimY, 0);
        vesselOffsetGroup.add(new THREE.Mesh(beakGeo, rimMat));

        const fluidGeo = new THREE.CylinderGeometry(
          (W_PRISM * 0.98) / Math.SQRT2,
          0.015,
          H,
          4
        );
        fluidGeo.rotateY(Math.PI / 4);
        fluidGeo.translate(0, apexY + H / 2, 0);
        pyramidFluidMesh = new THREE.Mesh(fluidGeo, getFluidMat());
        pyramidFluidMesh.scale.set(0.0001, 0.0001, 0.0001);
        vesselOffsetGroup.add(pyramidFluidMesh);

        const standRing = new THREE.Mesh(
          new THREE.TorusGeometry(W_PRISM * 0.45, 0.04, 16, 4),
          rimMat
        );
        standRing.rotation.x = Math.PI / 2;
        standRing.rotation.z = Math.PI / 4;
        standRing.position.y = apexY + H * 0.35;
        standRig.add(standRing);

        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI * 2) / 4 + Math.PI / 4;
          const legGeo = new THREE.CylinderGeometry(0.035, 0.035, apexY + H * 0.35, 16);
          legGeo.translate(0, (apexY + H * 0.35) / 2, 0);
          const leg = new THREE.Mesh(legGeo, rimMat);
          leg.position.set(Math.cos(angle) * W_PRISM * 0.5, 0, Math.sin(angle) * W_PRISM * 0.5);
          standRig.add(leg);
        }
      }
    }

    rebuildShapes(propsRef.current.shapePair);

    // ==========================================
    // 9. Simulation State Loop with Fluid Dynamics
    // ==========================================
    let currentShapePair = propsRef.current.shapePair;
    let currentLiquidType = propsRef.current.liquidType;

    let coneFillProgress = 0;
    let autoPourProgress = 0;
    let cylinderFillHeight = 0;
    let lastTime = performance.now();
    let frameId = 0;
    let isPouringSoundActive = false;

    // Smoothed tilt angle for silky physics feel
    let smoothedTilt = 0;

    function tick() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const {
        shapePair: activeShape,
        liquidType: activeLiquid,
        stage: activeStage,
        controlMode: activeMode,
        manualTilt: activeManualTilt,
        animSpeed: activeSpeed,
        pourCount: activePours,
      } = propsRef.current;

      if (activeShape !== currentShapePair) {
        currentShapePair = activeShape;
        rebuildShapes(activeShape);
      }

      if (activeLiquid !== currentLiquidType) {
        currentLiquidType = activeLiquid;
        const mat = getFluidMat();
        if (prismFluidMesh) prismFluidMesh.material = mat;
        if (pyramidFluidMesh) pyramidFluidMesh.material = mat;
        const fluidHex = activeLiquid === 'water' ? 0x38bdf8 : 0xd97706;
        streamMat.color.setHex(fluidHex);
        dropletMat.color.setHex(fluidHex);
        ripples.forEach((r) => r.mat.color.setHex(fluidHex));
      }

      const speedMult = activeSpeed;
      const isCyl = activeShape === 'cylinder_cone';
      const spoutRadius = isCyl ? R_CYL : W_PRISM / 2;
      const apexY = 0.35;
      const topRimY = apexY + H;

      const restSpoutX = CONE_REST_X + spoutRadius;
      const restSpoutY = topRimY;
      const pourSpoutTargetX = PRISM_POS_X - spoutRadius * 0.35;
      const pourSpoutTargetY = H + 0.85;

      let isActivelyStreaming = false;
      let currentFlowRate = 0; // 0 to 1

      // ----------------------------------------------------
      // Mode 1: MANUAL HANDS-ON EXPERIMENT
      // ----------------------------------------------------
      if (activeMode === 'manual') {
        // Smoothly interpolate current tilt to user's slider/button input
        smoothedTilt = THREE.MathUtils.damp(smoothedTilt, activeManualTilt, 10, dt);

        if (activeStage === 'ready') {
          coneFillProgress = 0;
          cylinderFillHeight = (activePours / 3) * H;
        } else if (activeStage === 'fill_cone') {
          // Fill cone
          coneFillProgress = Math.min(1, coneFillProgress + dt * 1.2 * speedMult);
          if (!isPouringSoundActive && coneFillProgress > 0.05 && coneFillProgress < 0.95) {
            sound.startPourSound(activeLiquid);
            isPouringSoundActive = true;
          }
          if (coneFillProgress >= 1) {
            if (isPouringSoundActive) {
              sound.stopPourSound();
              isPouringSoundActive = false;
            }
            sound.playChime(false);
            onStageChange('cone_filled');
          }
        }

        // Lift & Tilt Kinematics based on smoothedTilt (0 to 1)
        // 0.0 to 0.2: Lift and glide to cylinder
        // 0.2 to 1.0: Tilt around spout and pour
        let targetSpoutX = restSpoutX;
        let targetSpoutY = restSpoutY;
        let targetTiltAngle = 0;

        if (smoothedTilt < 0.2) {
          const t = smoothedTilt / 0.2;
          const ease = t * t * (3 - 2 * t);
          targetSpoutX = THREE.MathUtils.lerp(restSpoutX, pourSpoutTargetX, ease);
          targetSpoutY = THREE.MathUtils.lerp(restSpoutY, pourSpoutTargetY, ease);
          targetTiltAngle = 0;
        } else {
          targetSpoutX = pourSpoutTargetX;
          targetSpoutY = pourSpoutTargetY;

          const p = (smoothedTilt - 0.2) / 0.8; // 0 to 1
          targetTiltAngle = p * 1.85; // 0 to 105 degrees

          // Water begins to pour out as tilt passes 0.25 (~25 degrees)!
          if (p > 0.08 && coneFillProgress > 0.001) {
            // Flow rate proportional to how steep the tilt is
            const flowStrength = Math.min(1, (p - 0.08) * 1.5);
            currentFlowRate = flowStrength;
            isActivelyStreaming = true;

            // Fluid drains out of cone
            const drainAmount = dt * 0.45 * flowStrength * speedMult;
            const actualDrain = Math.min(coneFillProgress, drainAmount);
            coneFillProgress -= actualDrain;

            // Cylinder height increases by exact 1/3 volume per cone
            cylinderFillHeight = Math.min(H, cylinderFillHeight + actualDrain * (H / 3));

            // Sound modulation
            if (!isPouringSoundActive) {
              sound.startPourSound(activeLiquid);
              isPouringSoundActive = true;
            }
            sound.updateFlowRate(flowStrength);

            // Check if 1/3 reached
            if (activePours === 0 && coneFillProgress <= 0.02 && cylinderFillHeight >= H / 3 - 0.05) {
              sound.playChime(false);
              onStageChange('completed_1');
            } else if (activePours === 1 && coneFillProgress <= 0.02 && cylinderFillHeight >= (2 * H) / 3 - 0.05) {
              sound.playChime(false);
              onStageChange('completed_2');
            } else if (activePours === 2 && coneFillProgress <= 0.02 && cylinderFillHeight >= H - 0.05) {
              sound.playChime(true);
              onStageChange('completed_3');
            }
          }
        }

        coneRig.position.set(targetSpoutX - spoutRadius, targetSpoutY - topRimY, 0);
        spoutPivot.rotation.z = -targetTiltAngle;

        if (onUpdateManualStats) {
          onUpdateManualStats(
            Math.round(coneFillProgress * 100),
            Math.round((cylinderFillHeight / H) * 100) / 100
          );
        }
      }

      // ----------------------------------------------------
      // Mode 2: AUTO GUIDED DEMONSTRATION
      // ----------------------------------------------------
      else {
        if (activeStage === 'ready') {
          coneFillProgress = 0;
          autoPourProgress = 0;
          cylinderFillHeight = (activePours / 3) * H;
          coneRig.position.set(CONE_REST_X, 0, 0);
          spoutPivot.rotation.set(0, 0, 0);
          streamMesh.visible = false;
        } else if (activeStage === 'fill_cone') {
          coneFillProgress = Math.min(1, coneFillProgress + dt * 1.0 * speedMult);
          if (!isPouringSoundActive && coneFillProgress > 0.05 && coneFillProgress < 0.95) {
            sound.startPourSound(activeLiquid);
            isPouringSoundActive = true;
          }
          if (coneFillProgress >= 1) {
            if (isPouringSoundActive) {
              sound.stopPourSound();
              isPouringSoundActive = false;
            }
            sound.playChime(false);
            onStageChange('cone_filled');
          }
        } else if (activeStage === 'cone_filled') {
          coneFillProgress = 1;
          autoPourProgress = 0;
        } else if (activeStage === 'pouring_1' || activeStage === 'pouring_2' || activeStage === 'pouring_3') {
          autoPourProgress = Math.min(1, autoPourProgress + dt * 0.28 * speedMult);

          const currentPouredStep = activeStage === 'pouring_1' ? 1 : activeStage === 'pouring_2' ? 2 : 3;
          const targetCylHeight = (currentPouredStep / 3) * H;
          const startCylHeight = ((currentPouredStep - 1) / 3) * H;

          if (autoPourProgress < 0.25) {
            const t = autoPourProgress / 0.25;
            const ease = t * t * (3 - 2 * t);
            const curSpoutX = THREE.MathUtils.lerp(restSpoutX, pourSpoutTargetX, ease);
            const curSpoutY = THREE.MathUtils.lerp(restSpoutY, pourSpoutTargetY, ease);
            coneRig.position.set(curSpoutX - spoutRadius, curSpoutY - topRimY, 0);
            spoutPivot.rotation.z = 0;
          } else if (autoPourProgress < 0.85) {
            const p = (autoPourProgress - 0.25) / 0.6;
            const smoothP = 0.5 - 0.5 * Math.cos(p * Math.PI);

            coneRig.position.set(pourSpoutTargetX - spoutRadius, pourSpoutTargetY - topRimY, 0);
            spoutPivot.rotation.z = -smoothP * 1.85;

            coneFillProgress = Math.max(0, 1 - smoothP);
            cylinderFillHeight = startCylHeight + smoothP * (targetCylHeight - startCylHeight);

            isActivelyStreaming = true;
            currentFlowRate = Math.sin(smoothP * Math.PI);

            if (!isPouringSoundActive && p > 0.05) {
              sound.startPourSound(activeLiquid);
              isPouringSoundActive = true;
            }
            sound.updateFlowRate(currentFlowRate);
          } else {
            const r = (autoPourProgress - 0.85) / 0.15;
            const returnEase = r * r * (3 - 2 * r);
            spoutPivot.rotation.z = -1.85 * (1 - returnEase);
            const curSpoutX = THREE.MathUtils.lerp(pourSpoutTargetX, restSpoutX, returnEase);
            const curSpoutY = THREE.MathUtils.lerp(pourSpoutTargetY, restSpoutY, returnEase);
            coneRig.position.set(curSpoutX - spoutRadius, curSpoutY - topRimY, 0);
            coneFillProgress = 0;
            cylinderFillHeight = targetCylHeight;
          }

          if (autoPourProgress >= 1) {
            if (isPouringSoundActive) {
              sound.stopPourSound();
              isPouringSoundActive = false;
            }
            const isFinal = currentPouredStep === 3;
            sound.playChime(isFinal);
            if (currentPouredStep === 1) onStageChange('completed_1');
            else if (currentPouredStep === 2) onStageChange('completed_2');
            else onStageChange('completed_3');
          }
        }
      }

      // Stop pouring sound when stream stops
      if (!isActivelyStreaming && isPouringSoundActive && activeStage !== 'fill_cone') {
        sound.stopPourSound();
        isPouringSoundActive = false;
      }

      // ----------------------------------------------------
      // 10. Dynamic Stream Curve & Droplet Particle Physics
      // ----------------------------------------------------
      if (isActivelyStreaming) {
        streamMesh.visible = true;

        _spoutWorld.set(0, 0, 0);
        spoutPivot.localToWorld(_spoutWorld);
        _spoutWorld.x += 0.12;

        // Subtle water surface slosh wave at the impact point
        const surfaceWave = Math.sin(now * 0.015) * 0.02;
        _targetWorld.set(PRISM_POS_X, cylinderFillHeight + surfaceWave, 0);

        const midX = (_spoutWorld.x + _targetWorld.x) / 2 + 0.05;
        const midY = _spoutWorld.y - 0.25;

        streamCurve.v0.copy(_spoutWorld);
        streamCurve.v1.set(midX, midY, 0);
        streamCurve.v2.copy(_targetWorld);

        // Core stream thickness pulses with dynamic flow rate
        const coreRadius = 0.035 + currentFlowRate * 0.03;
        streamMesh.geometry.dispose();
        streamMesh.geometry = new THREE.TubeGeometry(streamCurve, 16, coreRadius, 8, false);

        // Emit new droplets from spout
        const spawnCount = Math.floor(currentFlowRate * 4) + 1;
        for (let s = 0; s < spawnCount; s++) {
          const inactive = droplets.find((d) => !d.active);
          if (inactive) {
            inactive.active = true;
            inactive.x = _spoutWorld.x + (Math.random() - 0.5) * 0.06;
            inactive.y = _spoutWorld.y - 0.02;
            inactive.z = (Math.random() - 0.5) * 0.08;
            inactive.vx = (PRISM_POS_X - _spoutWorld.x) * 1.2 + (Math.random() - 0.5) * 0.4;
            inactive.vy = -0.5 - Math.random() * 0.8;
            inactive.vz = (Math.random() - 0.5) * 0.3;
            inactive.life = 0;
            inactive.maxLife = 0.45 + Math.random() * 0.25;
            inactive.scale = 0.6 + Math.random() * 0.7;
          }
        }
      } else {
        streamMesh.visible = false;
      }

      // Update active droplets with gravity and collision with water surface
      let activeCount = 0;
      droplets.forEach((d, idx) => {
        if (d.active) {
          d.life += dt;
          d.vy -= 12.0 * dt; // gravity
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.z += d.vz * dt;

          const waterSurfaceY = cylinderFillHeight;
          // Hit the cylinder water surface or died of old age
          if (d.y <= waterSurfaceY || d.life >= d.maxLife) {
            d.active = false;
            _dummyPos.set(0, -999, 0);
          } else {
            _dummyPos.set(d.x, d.y, d.z);
            activeCount++;
          }
        } else {
          _dummyPos.set(0, -999, 0);
        }

        _dummyScale.set(d.scale, d.scale, d.scale);
        _dummyMatrix.makeScale(_dummyScale.x, _dummyScale.y, _dummyScale.z);
        _dummyMatrix.setPosition(_dummyPos.x, _dummyPos.y, _dummyPos.z);
        dropletInstances.setMatrixAt(idx, _dummyMatrix);
      });
      dropletInstances.instanceMatrix.needsUpdate = true;

      // Update Surface Ripples on Cylinder Water
      ripples.forEach((r) => {
        if (isActivelyStreaming && cylinderFillHeight > 0.02) {
          r.mesh.visible = true;
          r.age += dt * 2.2;
          if (r.age > 1) r.age = 0;

          r.mesh.position.set(0, cylinderFillHeight + 0.015, 0);
          const rScale = 0.3 + r.age * 2.2;
          r.mesh.scale.set(rScale, rScale, 1);
          r.mat.opacity = (1 - r.age) * 0.85;
        } else {
          r.mesh.visible = false;
        }
      });

      // ----------------------------------------------------
      // 11. Update Fluid Meshes & Clipping Plane
      // ----------------------------------------------------
      if (prismFluidMesh) {
        const safeH = Math.max(0.0001, cylinderFillHeight);
        prismFluidMesh.scale.y = safeH;
        prismFluidMesh.visible = cylinderFillHeight > 0.01;
      }

      if (pyramidFluidMesh) {
        // As fluid drains, scale and clip plane adjust
        const s = Math.max(0.0001, Math.cbrt(coneFillProgress));
        pyramidFluidMesh.scale.set(s, s, s);
        pyramidFluidMesh.visible = coneFillProgress > 0.005;

        // Update clipping plane so water stays horizontal inside tilted cone
        // World height of water in cone
        const currentWaterWorldY = spoutPivot.position.y - (1 - coneFillProgress) * H * 0.5;
        fluidClipPlane.constant = currentWaterWorldY;
      }

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (isPouringSoundActive) sound.stopPourSound();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
