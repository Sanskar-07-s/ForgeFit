// ForgeFit AI - 3D Fitness Mannequin Trainer Engine (v5.1)
// Lazy-loads Three.js dynamically to satisfy chunk constraints

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCw, ZoomIn, ZoomOut, Sparkles, RefreshCw } from 'lucide-react';

interface Props {
  exerciseName: string;
  mode: 'demo' | 'workout' | 'coaching';
  className?: string;
}

export const FitnessAvatar3D: React.FC<Props> = ({ exerciseName, mode, className = '' }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [playing, setPlaying] = useState(true);
  const [slowMo, setSlowMo]   = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom]       = useState(1.0);
  const [loadingThree, setLoadingThree] = useState(true);

  // Pacing phase guides
  const [tempoPhase, setTempoPhase] = useState<'eccentric' | 'pause' | 'concentric'>('eccentric');
  const [tempoSecs, setTempoSecs] = useState(3);

  // Refs for animation loop closures
  const stateRef = useRef({
    playing: true,
    slowMo: false,
    autoRotate: true,
    cameraPreset: 'front',
    zoomFactor: 1.0,
    time: 0,
  });

  useEffect(() => {
    stateRef.current.playing = playing;
    stateRef.current.slowMo = slowMo;
    stateRef.current.autoRotate = autoRotate;
    stateRef.current.zoomFactor = zoom;
  }, [playing, slowMo, autoRotate, zoom]);

  const setCameraPreset = (preset: 'front' | 'side' | 'back' | 'top') => {
    stateRef.current.cameraPreset = preset;
  };

  useEffect(() => {
    let active = true;
    let cleanupFn = () => {};

    // ── Lazy Load Three.js ──
    setLoadingThree(true);
    import('three').then((THREE) => {
      if (!active || !mountRef.current) return;
      setLoadingThree(false);

      const width  = mountRef.current.clientWidth || 400;
      const height = mountRef.current.clientHeight || 300;

      // ── 1. Create Scene & Camera ──
      const scene = new THREE.Scene();
      scene.background = null;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 1.5, 5);

      // ── 2. Create WebGL Renderer ──
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);

      const dom = renderer.domElement;
      dom.style.cursor = 'grab';

      // ── 3. Add Lighting ──
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0x22d3ee, 1.8); // Neon Cyan keylight
      dirLight1.position.set(5, 5, 5);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x8b5cf6, 1.5); // Neon Purple fill
      dirLight2.position.set(-5, 5, -5);
      scene.add(dirLight2);

      const gridHelper = new THREE.GridHelper(10, 20, 0x22d3ee, 0x475569);
      gridHelper.position.y = -1;
      scene.add(gridHelper);

      // ── 4. Build Mannequin ──
      const group = new THREE.Group();
      scene.add(group);

      const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.8 });
      const cyanMat  = new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.1, metalness: 0.7 });
      const purpMat  = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.2, metalness: 0.5 });

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), cyanMat);
      head.position.y = 0.9;
      group.add(head);

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.8, 16), purpMat);
      torso.position.y = 0.4;
      group.add(torso);

      const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), metalMat);
      pelvis.position.y = 0.0;
      group.add(pelvis);

      // Joints and arms
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

      // Legs
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

      // Barbell
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
      barbell.position.set(0, 0.7, 0.35);
      scene.add(barbell);
      barbell.visible = false;

      // ── Mouse Drag Rotation States ──
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };
      let rotationX = 0;
      let rotationY = 0.05;

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
        stateRef.current.cameraPreset = 'manual';
      };

      const onMouseUp = () => { isDragging = false; };

      dom.addEventListener('mousedown', onMouseDown);
      dom.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // ── 5. Animation loop ──
      let animationFrameId: number;

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const state = stateRef.current;
        if (state.playing) {
          const speed = state.slowMo ? 0.015 : 0.035;
          state.time += speed;
        }

        const t = state.time;
        
        // Rep Pacing Calculations
        // Loop is 2*PI, concentric lifting vs eccentric lowering phases
        const wave = Math.sin(t);
        const normTime = (t % (2 * Math.PI)) / (2 * Math.PI); // 0.0 to 1.0

        if (normTime < 0.4) {
          setTempoPhase('eccentric');
          setTempoSecs(3);
        } else if (normTime < 0.6) {
          setTempoPhase('pause');
          setTempoSecs(1);
        } else {
          setTempoPhase('concentric');
          setTempoSecs(2);
        }

        // Reset Rig defaults
        group.position.set(0, 0, 0);
        group.rotation.set(0, 0, 0);
        head.rotation.set(0, 0, 0);
        torso.rotation.set(0, 0, 0);
        barbell.visible = false;
        lShoulder.rotation.set(0, 0, 0);
        rShoulder.rotation.set(0, 0, 0);
        lElbow.rotation.set(0, 0, 0);
        rElbow.rotation.set(0, 0, 0);
        lHip.rotation.set(0, 0, 0);
        rHip.rotation.set(0, 0, 0);
        lKnee.rotation.set(0, 0, 0);
        rKnee.rotation.set(0, 0, 0);

        const exercise = exerciseName.toLowerCase();

        // ── Poses / Animations ──
        if (exercise.includes('bicep curl')) {
          lShoulder.rotation.x = 0.2;
          rShoulder.rotation.x = 0.2;
          const flex = (wave + 1) * 0.7;
          lElbow.rotation.x = flex;
          rElbow.rotation.x = flex;
        } 
        else if (exercise.includes('squat')) {
          const crouch = (wave + 1) * 0.35;
          group.position.y = -crouch * 0.8;
          lHip.rotation.x = -crouch * 1.5;
          rHip.rotation.x = -crouch * 1.5;
          lKnee.rotation.x = crouch * 2;
          rKnee.rotation.x = crouch * 2;
          torso.rotation.x = crouch * 0.5;
          lShoulder.rotation.x = -1.2;
          rShoulder.rotation.x = -1.2;
        } 
        else if (exercise.includes('bench press')) {
          group.rotation.x = -Math.PI / 2;
          group.position.y = -0.5;
          barbell.visible = true;
          const press = (wave + 1) * 0.25;
          barbell.position.set(0, 0.4 + press, 0);
          lShoulder.rotation.z = -1.4;
          rShoulder.rotation.z = 1.4;
          lElbow.rotation.y = -press * 1.5;
          rElbow.rotation.y = press * 1.5;
        } 
        else if (exercise.includes('deadlift')) {
          barbell.visible = true;
          const lift = (wave + 1) * 0.4;
          lHip.rotation.x = -lift * 1.2;
          rHip.rotation.x = -lift * 1.2;
          lKnee.rotation.x = lift * 0.8;
          rKnee.rotation.x = lift * 0.8;
          group.position.y = -lift * 0.4;
          torso.rotation.x = lift * 1.2;
          head.rotation.x = -lift * 0.6;
          barbell.position.set(0, 0.2 + (0.8 - lift) * 0.6, 0.35);
          lShoulder.rotation.x = lift * 0.5;
          rShoulder.rotation.x = lift * 0.5;
        }
        else if (exercise.includes('push up') || exercise.includes('pushup')) {
          group.rotation.x = -Math.PI / 2.2;
          const push = (wave + 1) * 0.15;
          group.position.y = -0.6 + push;
          lShoulder.rotation.z = -1.2;
          rShoulder.rotation.z = 1.2;
          lElbow.rotation.y = -1.1 + push * 2;
          rElbow.rotation.y = 1.1 - push * 2;
        }
        else if (exercise.includes('pull up') || exercise.includes('pullup')) {
          const pull = (wave + 1) * 0.4;
          group.position.y = pull;
          lShoulder.rotation.z = -2.6 + pull * 0.8;
          rShoulder.rotation.z = 2.6 - pull * 0.8;
          lElbow.rotation.x = 1.8 - pull * 1.2;
          rElbow.rotation.x = 1.8 - pull * 1.2;
        }
        else if (exercise.includes('shoulder press')) {
          const press = (wave + 1) * 0.8;
          lShoulder.rotation.z = -press;
          rShoulder.rotation.z = press;
          lElbow.rotation.z = -0.4 + (1.6 - press) * 0.4;
          rElbow.rotation.z = 0.4 - (1.6 - press) * 0.4;
        }
        else if (exercise.includes('tricep pushdown')) {
          lShoulder.rotation.x = 0.1;
          rShoulder.rotation.x = 0.1;
          const extend = (wave + 1) * 0.6;
          lElbow.rotation.x = 1.5 - extend;
          rElbow.rotation.x = 1.5 - extend;
        }
        else if (exercise.includes('leg press')) {
          group.rotation.x = -Math.PI / 6;
          group.position.y = -0.2;
          const press = (wave + 1) * 0.5;
          lHip.rotation.x = -0.8 - press * 0.5;
          rHip.rotation.x = -0.8 - press * 0.5;
          lKnee.rotation.x = 1.2 - press * 1.0;
          rKnee.rotation.x = 1.2 - press * 1.0;
        }
        else {
          // Default Breathing stand
          head.rotation.y = wave * 0.1;
          lShoulder.rotation.z = -0.2 - wave * 0.05;
          rShoulder.rotation.z = 0.2 + wave * 0.05;
        }

        // Apply Mode styling changes
        if (mode === 'coaching') {
          // Change body color slightly or pause at bottom of eccentric motion for coaching cues
          if (tempoPhase === 'pause') {
            state.time -= 0.015; // slow down at peak squeeze to highlight form
          }
        }

        // Camera presets handling
        if (state.cameraPreset !== 'manual') {
          let targetX = 0;
          let targetY = 0.05;
          switch (state.cameraPreset) {
            case 'side': targetX = Math.PI / 2; break;
            case 'back': targetX = Math.PI; break;
            case 'top':  targetY = Math.PI / 2.1; break;
            case 'front':
            default: targetX = 0; break;
          }
          rotationX += (targetX - rotationX) * 0.08;
          rotationY += (targetY - rotationY) * 0.08;
        }

        if (state.autoRotate && state.cameraPreset === 'manual') {
          rotationX += 0.005;
        }

        const radius = 4 * state.zoomFactor;
        const x = Math.sin(rotationX) * Math.cos(rotationY) * radius;
        const z = Math.cos(rotationX) * Math.cos(rotationY) * radius;
        const y = 0.4 + Math.sin(rotationY) * radius;

        camera.position.set(x, y, z);
        camera.lookAt(0, 0.4, 0);

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      cleanupFn = () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        dom.removeEventListener('mousedown', onMouseDown);
        dom.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (mountRef.current && dom) {
          mountRef.current.removeChild(dom);
        }

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
    });

    return () => {
      active = false;
      cleanupFn();
    };
  }, [exerciseName, mode]);

  return (
    <div className={`relative flex flex-col glass-panel overflow-hidden border border-white/10 ${className}`}>
      {loadingThree && (
        <div className="absolute inset-0 z-20 bg-dark-bg/60 backdrop-blur-md flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-cyan animate-spin" />
          <p className="text-xs text-slate-400">Loading 3D Assets...</p>
        </div>
      )}

      {/* 3D Canvas mount point */}
      <div ref={mountRef} className="w-full h-[260px] md:h-[300px] relative z-10" />

      {/* Camera angle presets floating overlay */}
      <div className="absolute top-3 right-3 z-20 flex gap-1.5">
        {(['front', 'side', 'back', 'top'] as const).map(preset => (
          <button
            key={preset}
            onClick={() => setCameraPreset(preset)}
            className="px-2 py-0.5 rounded-lg bg-dark-bg/60 border border-white/10 text-[9px] font-extrabold uppercase text-slate-400 hover:text-white hover:border-brand-cyan/40 transition-all"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Zoom control buttons */}
      <div className="absolute bottom-16 right-3 z-20 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
          className="p-1.5 rounded-lg bg-dark-bg/60 border border-white/10 text-slate-400 hover:text-white hover:border-brand-cyan/40 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(z => Math.min(2.0, z + 0.15))}
          className="p-1.5 rounded-lg bg-dark-bg/60 border border-white/10 text-slate-400 hover:text-white hover:border-brand-cyan/40 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Pacing Visualizer Timing Bar */}
      <div className="px-4 pt-3 pb-1 relative z-20 bg-white/[0.01] border-t border-white/5 space-y-1">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-cyan" /> Tempo Guidance
          </span>
          <span className="capitalize font-black text-brand-cyan">
            {tempoPhase} ({tempoSecs}s)
          </span>
        </div>
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-brand-rose transition-all duration-300"
            style={{
              width: tempoPhase === 'eccentric' ? '50%' : '0%',
              boxShadow: tempoPhase === 'eccentric' ? '0 0 6px #EF4444' : 'none',
            }}
          />
          <div
            className="h-full bg-brand-purple transition-all duration-300"
            style={{
              width: tempoPhase === 'pause' ? '20%' : '0%',
              boxShadow: tempoPhase === 'pause' ? '0 0 6px #8B5CF6' : 'none',
            }}
          />
          <div
            className="h-full bg-brand-cyan transition-all duration-300"
            style={{
              width: tempoPhase === 'concentric' ? '30%' : '0%',
              boxShadow: tempoPhase === 'concentric' ? '0 0 6px #22D3EE' : 'none',
            }}
          />
        </div>
      </div>

      {/* Base controls footer */}
      <div className="border-t border-white/5 bg-white/[0.02] px-4 py-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying(p => !p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/20 transition-colors"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setSlowMo(s => !s)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              slowMo
                ? 'bg-brand-purple/20 border-brand-purple/40 text-brand-purple'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
          >
            Slow-Mo
          </button>
        </div>

        <button
          onClick={() => setAutoRotate(r => !r)}
          className={`p-2 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold ${
            autoRotate
              ? 'bg-brand-cyan/20 border-brand-cyan/40 text-brand-cyan'
              : 'bg-white/5 border-white/10 text-slate-500'
          }`}
        >
          <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} /> Orbit
        </button>
      </div>
    </div>
  );
};
