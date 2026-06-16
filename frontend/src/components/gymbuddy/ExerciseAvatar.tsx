// ForgeFit AI - 3D Exercise Demonstration Engine (v5.0)
// Pure Three.js humanoid rig and exercise animation engine

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, Camera, RotateCw, ZoomIn, ZoomOut, Zap } from 'lucide-react';

interface Props {
  exerciseName: string;
  className?: string;
}

export const ExerciseAvatar: React.FC<Props> = ({ exerciseName, className = '' }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [playing, setPlaying] = useState(true);
  const [slowMo, setSlowMo]   = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [zoom, setZoom]       = useState(1.0);

  // Refs for animation variables
  const stateRef = useRef({
    playing: true,
    slowMo: false,
    autoRotate: false,
    cameraPreset: 'front', // front, side, back, top, manual
    zoomFactor: 1.0,
    time: 0,
  });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current.playing = playing;
    stateRef.current.slowMo = slowMo;
    stateRef.current.autoRotate = autoRotate;
    stateRef.current.zoomFactor = zoom;
  }, [playing, slowMo, autoRotate, zoom]);

  // Handle camera presets
  const setCameraPreset = (preset: 'front' | 'side' | 'back' | 'top') => {
    stateRef.current.cameraPreset = preset;
  };

  useEffect(() => {
    if (!mountRef.current) return () => {};

    const width  = mountRef.current.clientWidth || 400;
    const height = mountRef.current.clientHeight || 300;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationX = 0; // horizontal angle offset
    let rotationY = 0.05; // vertical angle offset

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      rotationX -= deltaX * 0.007;
      rotationY = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationY + deltaY * 0.007));

      previousMousePosition = { x: e.clientX, y: e.clientY };
      
      // Auto rotate turns off when manually dragging
      if (stateRef.current.autoRotate) {
        setAutoRotate(false);
      }
      
      stateRef.current.cameraPreset = 'manual';
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Touch events for mobile responsiveness
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      rotationX -= deltaX * 0.007;
      rotationY = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationY + deltaY * 0.007));

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      
      if (stateRef.current.autoRotate) {
        setAutoRotate(false);
      }
      
      stateRef.current.cameraPreset = 'manual';
    };

    // ── 1. Create Scene & Camera ──
    const scene = new THREE.Scene();
    // Premium dark/light responsive background color will be handled by canvas transparency
    scene.background = null; 

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 5);

    // ── 2. Create Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('touchstart', onTouchStart);
    dom.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onMouseUp);

    // ── 3. Add Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x22d3ee, 1.5); // Neon Cyan keylight
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8b5cf6, 1.2); // Neon Purple fill
    dirLight2.position.set(-5, 5, -5);
    scene.add(dirLight2);

    // Grid floor
    const gridHelper = new THREE.GridHelper(10, 20, 0x22d3ee, 0x475569);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // ── 4. Build Humanoid Figure ──
    const group = new THREE.Group();
    scene.add(group);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });
    const cyanMat  = new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.2, metalness: 0.6 });
    const purpMat  = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.3, metalness: 0.5 });

    // Rig parts
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), cyanMat);
    head.position.y = 0.9;
    group.add(head);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.8, 16), purpMat);
    torso.position.y = 0.4;
    group.add(torso);

    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), metalMat);
    pelvis.position.y = 0.0;
    group.add(pelvis);

    // Left Arm Hierarchy
    const lShoulder = new THREE.Group();
    lShoulder.position.set(0.3, 0.7, 0);
    group.add(lShoulder);
    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35), metalMat);
    lUpperArm.position.y = -0.175;
    lShoulder.add(lUpperArm);

    const lElbow = new THREE.Group();
    lElbow.position.y = -0.35;
    lShoulder.add(lElbow);
    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.35), cyanMat);
    lForearm.position.y = -0.175;
    lElbow.add(lForearm);

    // Right Arm Hierarchy
    const rShoulder = new THREE.Group();
    rShoulder.position.set(-0.3, 0.7, 0);
    group.add(rShoulder);
    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35), metalMat);
    rUpperArm.position.y = -0.175;
    rShoulder.add(rUpperArm);

    const rElbow = new THREE.Group();
    rElbow.position.y = -0.35;
    rShoulder.add(rElbow);
    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.35), cyanMat);
    rForearm.position.y = -0.175;
    rElbow.add(rForearm);

    // Left Leg Hierarchy
    const lHip = new THREE.Group();
    lHip.position.set(0.15, -0.1, 0);
    group.add(lHip);
    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.45), purpMat);
    lThigh.position.y = -0.225;
    lHip.add(lThigh);

    const lKnee = new THREE.Group();
    lKnee.position.y = -0.45;
    lHip.add(lKnee);
    const lCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.45), metalMat);
    lCalf.position.y = -0.225;
    lKnee.add(lCalf);

    // Right Leg Hierarchy
    const rHip = new THREE.Group();
    rHip.position.set(-0.15, -0.1, 0);
    group.add(rHip);
    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.45), purpMat);
    rThigh.position.y = -0.225;
    rHip.add(rThigh);

    const rKnee = new THREE.Group();
    rKnee.position.y = -0.45;
    rHip.add(rKnee);
    const rCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.45), metalMat);
    rCalf.position.y = -0.225;
    rKnee.add(rCalf);

    // Add Barbell Mesh (for pressing/deadlifting)
    const barbell = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8), metalMat);
    bar.rotation.z = Math.PI / 2;
    barbell.add(bar);

    const plateL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), purpMat);
    plateL.position.x = 0.85;
    plateL.rotation.z = Math.PI / 2;
    barbell.add(plateL);

    const plateR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), purpMat);
    plateR.position.x = -0.85;
    plateR.rotation.z = Math.PI / 2;
    barbell.add(plateR);

    barbell.position.set(0, 0.7, 0.3);
    scene.add(barbell);
    barbell.visible = false;

    // ── 5. Animation Loop ──
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const state = stateRef.current;

      // Handle Play/Pause & SlowMo
      if (state.playing) {
        const speed = state.slowMo ? 0.015 : 0.035;
        state.time += speed;
      }

      const t = state.time;
      const wave = Math.sin(t); // smooth transition back and forth

      // Reset rig defaults before applying current pose
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      head.rotation.set(0, 0, 0);
      torso.rotation.set(0, 0, 0);
      barbell.visible = false;

      lShoulder.rotation.set(0, 0, 0);
      lElbow.rotation.set(0, 0, 0);
      rShoulder.rotation.set(0, 0, 0);
      rElbow.rotation.set(0, 0, 0);

      lHip.rotation.set(0, 0, 0);
      lKnee.rotation.set(0, 0, 0);
      rHip.rotation.set(0, 0, 0);
      rKnee.rotation.set(0, 0, 0);

      // Normalize name
      const normName = exerciseName.toLowerCase();

      // ── Exercise Animation Rules ──
      if (normName.includes('bicep')) {
        // Bicep Curl: Upper arms slightly forward, forearms hinge at elbows
        lShoulder.rotation.x = 0.2;
        rShoulder.rotation.x = 0.2;
        const flex = (wave + 1) * 0.7; // 0 to 1.4 rad
        lElbow.rotation.x = flex;
        rElbow.rotation.x = flex;
      }
      else if (normName.includes('squat')) {
        // Squat: Entire body hips down, thighs up, knees bend
        const crouch = (wave + 1) * 0.35; // 0 to 0.7
        group.position.y = -crouch * 0.8;
        lHip.rotation.x = -crouch * 1.5;
        rHip.rotation.x = -crouch * 1.5;
        lKnee.rotation.x = crouch * 2;
        rKnee.rotation.x = crouch * 2;
        // Balance upper body
        torso.rotation.x = crouch * 0.5;
        // Hold arms forward
        lShoulder.rotation.x = -1.2;
        rShoulder.rotation.x = -1.2;
      }
      else if (normName.includes('bench press')) {
        // Bench Press: Lie flat, press barbell
        group.rotation.x = -Math.PI / 2;
        group.position.y = -0.5;
        barbell.visible = true;

        const press = (wave + 1) * 0.25; // 0 to 0.5
        barbell.position.set(0, 0.4 + press, 0);
        
        // Arms track barbell
        lShoulder.rotation.z = -1.4;
        rShoulder.rotation.z = 1.4;
        lElbow.rotation.y = -press * 1.5;
        rElbow.rotation.y = press * 1.5;
      }
      else if (normName.includes('pushup')) {
        // Pushups: Plank pose, dip down to floor
        group.rotation.x = -Math.PI / 2.2;
        const push = (wave + 1) * 0.15;
        group.position.y = -0.6 + push;

        lShoulder.rotation.z = -1.2;
        rShoulder.rotation.z = 1.2;
        lElbow.rotation.y = -1.1 + push * 2;
        rElbow.rotation.y = 1.1 - push * 2;
      }
      else if (normName.includes('shoulder') || normName.includes('overhead')) {
        // Shoulder Press: Raise weights overhead
        const press = (wave + 1) * 0.8; // 0 to 1.6
        // Arms raise
        lShoulder.rotation.z = -press;
        rShoulder.rotation.z = press;
        lElbow.rotation.z = -0.4 + (1.6 - press) * 0.4;
        rElbow.rotation.z = 0.4 - (1.6 - press) * 0.4;
      }
      else if (normName.includes('deadlift')) {
        // Deadlift: Hinge hips, lift barbell
        barbell.visible = true;
        const lift = (wave + 1) * 0.4; // 0 to 0.8
        
        // Body hinges
        lHip.rotation.x = -lift * 1.2;
        rHip.rotation.x = -lift * 1.2;
        lKnee.rotation.x = lift * 0.8;
        rKnee.rotation.x = lift * 0.8;
        group.position.y = -lift * 0.4;

        // Spine bends
        torso.rotation.x = lift * 1.2;
        head.rotation.x = -lift * 0.6; // Keep head look forward

        // Barbell tracks hands
        barbell.position.set(0, 0.2 + (0.8 - lift) * 0.6, 0.35);

        // Arms hold bar
        lShoulder.rotation.x = lift * 0.5;
        rShoulder.rotation.x = lift * 0.5;
      }
      else if (normName.includes('pull') || normName.includes('chin')) {
        // Pullups / Lat Pulldown: hang and pull up
        const pull = (wave + 1) * 0.4; // 0 to 0.8
        group.position.y = pull;

        lShoulder.rotation.z = -2.6 + pull * 0.8;
        rShoulder.rotation.z = 2.6 - pull * 0.8;
        lElbow.rotation.x = 1.8 - pull * 1.2;
        rElbow.rotation.x = 1.8 - pull * 1.2;
      }
      else if (normName.includes('tricep')) {
        // Tricep Pushdown: upper arms lock side, forearms extend down
        lShoulder.rotation.x = 0.1;
        rShoulder.rotation.x = 0.1;
        const extend = (wave + 1) * 0.6; // 0 to 1.2
        lElbow.rotation.x = 1.5 - extend;
        rElbow.rotation.x = 1.5 - extend;
      }
      else if (normName.includes('lat pulldown')) {
        // Sitting, pull bar down
        const pull = (wave + 1) * 0.4;
        lHip.rotation.x = -Math.PI / 3;
        rHip.rotation.x = -Math.PI / 3;
        lKnee.rotation.x = Math.PI / 3;
        rKnee.rotation.x = Math.PI / 3;
        group.position.y = -0.3;

        lShoulder.rotation.z = -2.6 + pull * 0.8;
        rShoulder.rotation.z = 2.6 - pull * 0.8;
        lElbow.rotation.x = 1.6 - pull * 1.2;
        rElbow.rotation.x = 1.6 - pull * 1.2;
      }
      else if (normName.includes('leg press')) {
        // Incline seated leg bend/extend
        group.rotation.x = -Math.PI / 6;
        group.position.y = -0.2;
        const press = (wave + 1) * 0.5; // 0 to 1.0

        lHip.rotation.x = -0.8 - press * 0.5;
        rHip.rotation.x = -0.8 - press * 0.5;
        lKnee.rotation.x = 1.2 - press * 1.0;
        rKnee.rotation.x = 1.2 - press * 1.0;

        lShoulder.rotation.x = 0.2;
        rShoulder.rotation.x = 0.2;
      }
      else {
        // Default animation: breathing/stand pose
        head.rotation.y = wave * 0.1;
        lShoulder.rotation.z = -0.2 - wave * 0.05;
        rShoulder.rotation.z = 0.2 + wave * 0.05;
      }

      // Handle camera preset interpolation
      if (state.cameraPreset !== 'manual') {
        let targetX = 0;
        let targetY = 0.05;
        switch (state.cameraPreset) {
          case 'side':
            targetX = Math.PI / 2;
            break;
          case 'back':
            targetX = Math.PI;
            break;
          case 'top':
            targetY = Math.PI / 2.1;
            break;
          case 'front':
          default:
            targetX = 0;
            break;
        }
        rotationX += (targetX - rotationX) * 0.08;
        rotationY += (targetY - rotationY) * 0.08;
      }

      // Auto rotation
      if (state.autoRotate) {
        rotationX += 0.006;
        rotationY += (0.05 - rotationY) * 0.08; // return to normal height
      }

      const radius = 4 * state.zoomFactor;
      const x = Math.sin(rotationX) * Math.cos(rotationY) * radius;
      const z = Math.cos(rotationX) * Math.cos(rotationY) * radius;
      const y = 0.4 + Math.sin(rotationY) * radius;

      const targetPos = new THREE.Vector3(x, y, z);
      const targetLook = new THREE.Vector3(0, 0.4, 0);

      camera.position.lerp(targetPos, 0.1);
      camera.lookAt(targetLook);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // dispose geometries/materials
      head.geometry.dispose();
      torso.geometry.dispose();
      pelvis.geometry.dispose();
      lUpperArm.geometry.dispose();
      lForearm.geometry.dispose();
      rUpperArm.geometry.dispose();
      rForearm.geometry.dispose();
      lThigh.geometry.dispose();
      lCalf.geometry.dispose();
      rThigh.geometry.dispose();
      rCalf.geometry.dispose();
      bar.geometry.dispose();
      plateL.geometry.dispose();
      plateR.geometry.dispose();

      cyanMat.dispose();
      purpMat.dispose();
      metalMat.dispose();
      renderer.dispose();
    };
  }, [exerciseName]);

  return (
    <div className={`relative flex flex-col glass-panel overflow-hidden border border-white/10 ${className}`}>
      {/* 3D Canvas wrapper */}
      <div ref={mountRef} className="w-full h-[280px] md:h-[320px] relative z-10" />

      {/* Control panel overlays */}
      <div className="absolute top-3 left-3 z-20 flex gap-1 bg-dark-bg/40 backdrop-blur-md px-2 py-1 rounded-xl border border-white/5">
        <span className="text-[10px] font-black uppercase tracking-wider text-brand-cyan px-1">
          3D Buddy Demo
        </span>
      </div>

      {/* Camera controls */}
      <div className="absolute top-3 right-3 z-20 flex gap-1">
        {(['front', 'side', 'back', 'top'] as const).map((preset) => (
          <button
            key={preset}
            onClick={() => setCameraPreset(preset)}
            className="px-2 py-1 text-[9px] font-bold uppercase rounded-lg bg-dark-bg/60 border border-white/10 text-slate-400 hover:text-white hover:border-brand-cyan/40 transition-all"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-16 right-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
          className="p-2 rounded-xl bg-dark-bg/60 border border-white/10 text-slate-400 hover:text-white hover:border-brand-cyan/40 transition-all shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(z => Math.min(2.0, z + 0.15))}
          className="p-2 rounded-xl bg-dark-bg/60 border border-white/10 text-slate-400 hover:text-white hover:border-brand-cyan/40 transition-all shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main player controls footer */}
      <div className="border-t border-white/5 bg-white/[0.03] px-4 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying(p => !p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/20 transition-colors"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setSlowMo(s => !s)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              slowMo
                ? 'bg-brand-purple/20 border-brand-purple/40 text-brand-purple'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            Slow-Mo
          </button>
        </div>

        <button
          onClick={() => setAutoRotate(r => !r)}
          className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold ${
            autoRotate
              ? 'bg-brand-cyan/20 border-brand-cyan/40 text-brand-cyan'
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          Auto Orbit
        </button>
      </div>
    </div>
  );
};
