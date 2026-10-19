import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  Box, 
  Rotate3d, 
  Layers, 
  Sliders, 
  Eye, 
  Maximize, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Camera,
  Play,
  Pause,
  Compass
} from 'lucide-react';

interface ThreeTopologySceneProps {
  onBackToStudio?: () => void;
}

export const ThreeTopologyScene: React.FC<ThreeTopologySceneProps> = ({ onBackToStudio }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Bottom dock controls state
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [explodedRatio, setExplodedRatio] = useState(0);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [isRotating, setIsRotating] = useState(true);
  const [activeFinish, setActiveFinish] = useState<'cyan' | 'gold' | 'titanium'>('cyan');
  const [cameraPreset, setCameraPreset] = useState<'orbit' | 'top' | 'close'>('orbit');

  // Mutable refs for Three.js render loop
  const stateRef = useRef({
    exploded: 0,
    speed: 1,
    rotating: true,
    finish: 'cyan',
    targetCameraPos: new THREE.Vector3(7, 5, 8),
    targetLookAt: new THREE.Vector3(0, 1.2, 0),
    isMouseDown: false,
    mousePos: { x: 0, y: 0 },
    orbitAngles: { theta: 0.8, phi: 1.1, radius: 11 },
  });

  // Keep stateRef in sync with React state
  useEffect(() => {
    stateRef.current.exploded = explodedRatio;
  }, [explodedRatio]);

  useEffect(() => {
    stateRef.current.speed = rotationSpeed;
    stateRef.current.rotating = isRotating;
  }, [rotationSpeed, isRotating]);

  useEffect(() => {
    stateRef.current.finish = activeFinish;
  }, [activeFinish]);

  useEffect(() => {
    if (cameraPreset === 'orbit') {
      stateRef.current.orbitAngles.radius = 11;
      stateRef.current.orbitAngles.phi = 1.1;
      stateRef.current.targetLookAt.set(0, 1.2, 0);
    } else if (cameraPreset === 'top') {
      stateRef.current.orbitAngles.radius = 13;
      stateRef.current.orbitAngles.phi = 0.15;
      stateRef.current.targetLookAt.set(0, 1.0, 0);
    } else if (cameraPreset === 'close') {
      stateRef.current.orbitAngles.radius = 5.2;
      stateRef.current.orbitAngles.phi = 1.2;
      stateRef.current.targetLookAt.set(0, 1.6, 0);
    }
  }, [cameraPreset]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 61);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(7, 5, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment Reflection via RoomEnvironment & PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Lighting Rig: Warm Key + Cool Hemisphere + Studio Rim
    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.8);
    keyLight.position.set(6, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    const d = 5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.4);
    scene.add(hemiLight);

    const rimLight = new THREE.PointLight(0x06b6d4, 3.5, 20);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // 4. Grounding: Titanium Grid Floor & Soft Radial Contact Shadow
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = -0.01;
    scene.add(floor);

    // Soft procedural radial contact shadow texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shadowCtx = shadowCanvas.getContext('2d')!;
    const grad = shadowCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    shadowCtx.fillStyle = grad;
    shadowCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.5, 5.5),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.85, depthWrite: false })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    scene.add(shadowPlane);

    // 5. Procedural Data Dial Canvas Texture for dials & readouts
    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 512;
    dialCanvas.height = 512;
    const dialCtx = dialCanvas.getContext('2d')!;
    dialCtx.fillStyle = '#090e1a';
    dialCtx.fillRect(0, 0, 512, 512);
    dialCtx.strokeStyle = '#06b6d4';
    dialCtx.lineWidth = 4;
    dialCtx.beginPath();
    dialCtx.arc(256, 256, 220, 0, Math.PI * 2);
    dialCtx.stroke();
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const r1 = i % 3 === 0 ? 190 : 205;
      dialCtx.beginPath();
      dialCtx.moveTo(256 + Math.cos(angle) * r1, 256 + Math.sin(angle) * r1);
      dialCtx.lineTo(256 + Math.cos(angle) * 215, 256 + Math.sin(angle) * 215);
      dialCtx.stroke();
    }
    dialCtx.fillStyle = '#38bdf8';
    dialCtx.font = 'bold 36px monospace';
    dialCtx.textAlign = 'center';
    dialCtx.fillText('DATAFLOW NODE v2.4', 256, 265);

    const dialTex = new THREE.CanvasTexture(dialCanvas);
    dialTex.colorSpace = THREE.SRGBColorSpace;
    dialTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // 6. Composite 3–12 Part Procedural Model: 3D DataFlow Topology Hub
    const rootHub = new THREE.Group();
    scene.add(rootHub);

    // Shared PBR Materials
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.25,
    });

    const coreCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.7,
      thickness: 1.2,
      clearcoat: 1.0,
    });

    const innerWireframeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.18,
    });

    // Part 1: Heavy Grounded Base Pedestal
    const baseGroup = new THREE.Group();
    const basePlinth = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.4, 32), titaniumMat);
    basePlinth.position.y = 0.2;
    basePlinth.castShadow = true;
    basePlinth.receiveShadow = true;
    baseGroup.add(basePlinth);

    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.08, 16, 64), goldMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.38;
    baseGroup.add(baseRing);
    rootHub.add(baseGroup);

    // Part 2: Middle Floating Dial Disc
    const dialDiscMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 1.9, 0.1, 48),
      new THREE.MeshStandardMaterial({
        map: dialTex,
        roughness: 0.3,
        metalness: 0.7,
      })
    );
    dialDiscMesh.position.y = 0.55;
    dialDiscMesh.castShadow = true;
    rootHub.add(dialDiscMesh);

    // Part 3: Inner Quantum Reactor Core (Spinning double octahedron)
    const coreGroup = new THREE.Group();
    coreGroup.position.y = 1.8;

    const coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), coreCrystalMat);
    coreMesh.castShadow = true;
    coreGroup.add(coreMesh);

    const wireframeMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.92, 1), innerWireframeMat);
    coreGroup.add(wireframeMesh);
    rootHub.add(coreGroup);

    // Part 4: Gyroscopic Gimbal Rings
    const gimbalGroup = new THREE.Group();
    gimbalGroup.position.y = 1.8;

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.04, 16, 64), titaniumMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.04, 16, 64), goldMat);
    gimbalGroup.add(ring1);
    gimbalGroup.add(ring2);
    rootHub.add(gimbalGroup);

    // Part 5: Upper Waveguide Emitter Pillar (LatheGeometry)
    const upperGroup = new THREE.Group();
    upperGroup.position.y = 3.0;

    const lathePoints = [];
    lathePoints.push(new THREE.Vector2(0, 0));
    lathePoints.push(new THREE.Vector2(0.6, 0.1));
    lathePoints.push(new THREE.Vector2(0.3, 0.6));
    lathePoints.push(new THREE.Vector2(0.5, 0.9));
    lathePoints.push(new THREE.Vector2(0.2, 1.2));
    lathePoints.push(new THREE.Vector2(0, 1.3));
    const emitterPillar = new THREE.Mesh(new THREE.LatheGeometry(lathePoints, 32), titaniumMat);
    emitterPillar.castShadow = true;
    upperGroup.add(emitterPillar);

    const emitterBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.5,
        roughness: 0.1,
      })
    );
    emitterBeacon.position.y = 1.35;
    upperGroup.add(emitterBeacon);
    rootHub.add(upperGroup);

    // Part 6: 4 Orbiting Satellite Data Nodes
    const satelliteGroup = new THREE.Group();
    satelliteGroup.position.y = 1.8;

    const satellites: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const satMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), titaniumMat);
      satMesh.position.set(Math.cos(angle) * 2.8, 0, Math.sin(angle) * 2.8);
      satMesh.castShadow = true;
      satelliteGroup.add(satMesh);
      satellites.push(satMesh);
    }
    rootHub.add(satelliteGroup);

    // Part 7: Ambient Constellation Points via InstancedMesh
    const starCount = 120;
    const starGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const starMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const instancedStars = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const radius = 4 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7;
      dummy.position.set(
        radius * Math.cos(theta) * Math.cos(phi),
        0.5 + Math.random() * 5,
        radius * Math.sin(theta) * Math.cos(phi)
      );
      dummy.updateMatrix();
      instancedStars.setMatrixAt(i, dummy.matrix);
    }
    instancedStars.instanceMatrix.needsUpdate = true;
    scene.add(instancedStars);

    // 7. Mouse Orbit & Damping Listeners
    const onMouseDown = (e: MouseEvent) => {
      if (e.target !== renderer.domElement) return;
      stateRef.current.isMouseDown = true;
      stateRef.current.mousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!stateRef.current.isMouseDown) return;
      const dx = e.clientX - stateRef.current.mousePos.x;
      const dy = e.clientY - stateRef.current.mousePos.y;
      stateRef.current.mousePos = { x: e.clientX, y: e.clientY };

      stateRef.current.orbitAngles.theta -= dx * 0.006;
      stateRef.current.orbitAngles.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, stateRef.current.orbitAngles.phi - dy * 0.006)
      );
    };

    const onMouseUp = () => {
      stateRef.current.isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stateRef.current.orbitAngles.radius = Math.max(
        4,
        Math.min(22, stateRef.current.orbitAngles.radius + e.deltaY * 0.01)
      );
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Handle Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 8. 60 FPS Lossless Animation Loop with Exponential Damping
    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const state = stateRef.current;

      // Update finish colors
      if (state.finish === 'gold') {
        titaniumMat.color.setHex(0xb45309);
        coreCrystalMat.color.setHex(0xf59e0b);
        coreCrystalMat.emissive.setHex(0xd97706);
      } else if (state.finish === 'titanium') {
        titaniumMat.color.setHex(0x1e293b);
        coreCrystalMat.color.setHex(0x94a3b8);
        coreCrystalMat.emissive.setHex(0x475569);
      } else {
        titaniumMat.color.setHex(0x334155);
        coreCrystalMat.color.setHex(0x06b6d4);
        coreCrystalMat.emissive.setHex(0x0284c7);
      }

      // Smooth exploded view displacement with exponential damping
      const targetBaseY = 0 - state.exploded * 0.6;
      const targetDialY = 0.55 - state.exploded * 0.3;
      const targetCoreY = 1.8;
      const targetGimbalY = 1.8;
      const targetUpperY = 3.0 + state.exploded * 1.6;
      const targetSatRadius = 2.8 + state.exploded * 1.8;

      baseGroup.position.y = THREE.MathUtils.damp(baseGroup.position.y, targetBaseY, 6, dt);
      dialDiscMesh.position.y = THREE.MathUtils.damp(dialDiscMesh.position.y, targetDialY, 6, dt);
      coreGroup.position.y = THREE.MathUtils.damp(coreGroup.position.y, targetCoreY, 6, dt);
      upperGroup.position.y = THREE.MathUtils.damp(upperGroup.position.y, targetUpperY, 6, dt);

      // Rotation & Kinematics
      if (state.rotating) {
        const rotDelta = dt * state.speed;
        coreMesh.rotation.y += rotDelta * 1.2;
        coreMesh.rotation.x += rotDelta * 0.6;
        wireframeMesh.rotation.y -= rotDelta * 0.8;

        ring1.rotation.x += rotDelta * 1.5;
        ring1.rotation.y += rotDelta * 0.9;
        ring2.rotation.y -= rotDelta * 1.1;
        ring2.rotation.z += rotDelta * 0.7;

        dialDiscMesh.rotation.y += rotDelta * 0.3;
        satelliteGroup.rotation.y += rotDelta * 0.8;
      }

      // Update Satellites radial distance
      satellites.forEach((sat, i) => {
        const ang = (i / 4) * Math.PI * 2;
        const curR = Math.sqrt(sat.position.x * sat.position.x + sat.position.z * sat.position.z);
        const newR = THREE.MathUtils.damp(curR, targetSatRadius, 6, dt);
        sat.position.x = Math.cos(ang) * newR;
        sat.position.z = Math.sin(ang) * newR;
        sat.rotation.y += dt * 2;
      });

      // Smooth camera position with orbit angles
      const targetCamX =
        state.targetLookAt.x +
        state.orbitAngles.radius * Math.sin(state.orbitAngles.phi) * Math.cos(state.orbitAngles.theta);
      const targetCamY =
        state.targetLookAt.y + state.orbitAngles.radius * Math.cos(state.orbitAngles.phi);
      const targetCamZ =
        state.targetLookAt.z +
        state.orbitAngles.radius * Math.sin(state.orbitAngles.phi) * Math.sin(state.orbitAngles.theta);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 5, dt);
      camera.lookAt(state.targetLookAt);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);

      // Memory cleanup
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-61px)] bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Badge */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl shadow-lg">
        <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
          <Rotate3d className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-white tracking-tight">3D Spatial Topology Reactor</h2>
          <p className="text-[10px] text-slate-400 font-mono">PBR ACES-Filmic · Damped Orbit · 60 FPS</p>
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock (<= 15% footprint, solid surfaces, no backdrop-filter over WebGL) */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-all duration-300 ease-out ${
          isDockCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
      >
        {/* Toggle Collapse Bar */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-b-0 border-slate-800 rounded-t-lg text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer shadow-md"
          >
            {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isDockCollapsed ? 'Show Controls' : 'Hide Controls (Zen Mode)'}</span>
          </button>
        </div>

        {/* Dock Controls Body */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-6">
          {/* Exploded View Slider */}
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Exploded View</span>
                <span className="text-cyan-400 tabular-nums">{Math.round(explodedRatio * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodedRatio}
                onChange={(e) => setExplodedRatio(parseFloat(e.target.value))}
                className="w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Finish Material Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">Finish:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveFinish('cyan')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  activeFinish === 'cyan' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cyan Mesh
              </button>
              <button
                onClick={() => setActiveFinish('gold')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  activeFinish === 'gold' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                Gold Ingot
              </button>
              <button
                onClick={() => setActiveFinish('titanium')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  activeFinish === 'titanium' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                Titanium
              </button>
            </div>
          </div>

          {/* Camera View Presets */}
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setCameraPreset('orbit')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  cameraPreset === 'orbit' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Orbit
              </button>
              <button
                onClick={() => setCameraPreset('top')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  cameraPreset === 'top' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Planar Top
              </button>
              <button
                onClick={() => setCameraPreset('close')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  cameraPreset === 'close' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Core Zoom
              </button>
            </div>
          </div>

          {/* Animation Toggle & Speed */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRotating(!isRotating)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
              title={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
            >
              {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setRotationSpeed((s) => (s === 1 ? 2 : s === 2 ? 0.5 : 1))}
              className="px-2.5 py-1 text-xs font-mono text-cyan-300 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
            >
              {rotationSpeed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
