// ForgeFit AI - 3D Studio Fitness Trainer (v7.2 — Grounded + Accurate Biomechanics)
import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, RotateCw, Sparkles, RefreshCw, User,
  PlayCircle, Wifi, WifiOff, Zap,
} from 'lucide-react';

interface Props {
  exerciseName: string;
  mode: 'demo' | 'workout' | 'coaching';
  className?: string;
}

interface MovementFrame {
  pct: number;
  bodyPos?: [number, number, number];
  bodyRot?: [number, number, number];
  waistRot?: [number, number, number];
  headRot?: [number, number, number];
  rShoulderRot?: [number, number, number];
  lShoulderRot?: [number, number, number];
  rUpperArmRot?: [number, number, number];
  lUpperArmRot?: [number, number, number];
  rForearmRot?: [number, number, number];
  lForearmRot?: [number, number, number];
  rHipRot?: [number, number, number];
  lHipRot?: [number, number, number];
  rThighRot?: [number, number, number];
  lThighRot?: [number, number, number];
  rCalfRot?: [number, number, number];
  lCalfRot?: [number, number, number];
  barbellPos?: [number, number, number];
  barbellVisible?: boolean;
}
type MovementDB = Record<string, MovementFrame[]>;

// BASE_Y: offsets the body so feet touch the floor grid at y=-0.8
// With thigh=0.45 + calf=0.42 + waist/hip chain = 0.69 below body origin → needs -0.11 base
const BASE_Y = -0.11;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (
  a: [number, number, number] | undefined,
  b: [number, number, number] | undefined,
  t: number
): [number, number, number] | undefined => {
  if (!a && !b) return undefined;
  const av = a ?? [0, 0, 0], bv = b ?? [0, 0, 0];
  return [lerp(av[0], bv[0], t), lerp(av[1], bv[1], t), lerp(av[2], bv[2], t)];
};

const resolveKey = (name: string, db: MovementDB): string | null => {
  const n = name.toLowerCase();
  if (db[n]) return n;
  const matchers: [string[], string][] = [
    [['pull up', 'pull-up', 'pullup', 'chin-up', 'chin up'], 'pull up'],
    [['push up', 'push-up', 'pushup'], 'push up'],
    [['bench press', 'chest press', 'incline', 'decline', 'flat press'], 'bench press'],
    [['fly', 'cable fly', 'chest fly'], 'bench press'],
    [['leg press'], 'leg press'],
    [['leg extension'], 'leg extension'],
    [['leg curl', 'hamstring curl'], 'leg curl'],
    [['lat pulldown', 'pulldown'], 'lat pulldown'],
    [['deadlift', 'rdl', 'romanian', 'hip thrust', 'stiff leg'], 'deadlift'],
    [['squat', 'lunge', 'bulgarian', 'split squat', 'goblet'], 'squat'],
    [['shoulder press', 'overhead press', 'military press', 'ohp', 'arnold'], 'shoulder press'],
    [['tricep pushdown', 'tricep extension', 'skull crusher', 'dip', 'kickback', 'tricep'], 'tricep extension'],
    [['bicep curl', 'hammer curl', 'barbell curl', 'dumbbell curl', 'preacher', 'bicep'], 'bicep curl'],
    [['curl'], 'bicep curl'],
    [['row', 'dumbbell row', 'barbell row', 'seated row', 'cable row', 't-bar', 'inverted row'], 'row'],
    [['calf raise', 'calf', 'standing calf', 'seated calf'], 'calf raise'],
    [['plank', 'hollow hold', 'side plank', 'ab wheel'], 'plank'],
  ];
  for (const [kws, key] of matchers) {
    if (kws.some(kw => n.includes(kw)) && db[key]) return key;
  }
  return null;
};

const interpolateFrames = (frames: MovementFrame[], progress: number): Partial<MovementFrame> => {
  if (!frames?.length) return {};
  const p = Math.max(0, Math.min(1, progress));
  let lo = frames[0], hi = frames[frames.length - 1];
  for (let i = 0; i < frames.length - 1; i++) {
    if (p >= frames[i].pct && p <= frames[i + 1].pct) { lo = frames[i]; hi = frames[i + 1]; break; }
  }
  const span = hi.pct - lo.pct;
  const t = span < 0.0001 ? 1 : (p - lo.pct) / span;
  const iv = (a: [number,number,number]|undefined, b: [number,number,number]|undefined) => lerpV(a, b, t);
  const r: Partial<MovementFrame> = { pct: p };
  const bp = iv(lo.bodyPos, hi.bodyPos); if (bp) r.bodyPos = bp;
  const br = iv(lo.bodyRot, hi.bodyRot); if (br) r.bodyRot = br;
  const wr = iv(lo.waistRot, hi.waistRot); if (wr) r.waistRot = wr;
  const hr = iv(lo.headRot, hi.headRot); if (hr) r.headRot = hr;
  const rs = iv(lo.rShoulderRot, hi.rShoulderRot); if (rs) r.rShoulderRot = rs;
  const ls = iv(lo.lShoulderRot, hi.lShoulderRot); if (ls) r.lShoulderRot = ls;
  const ru = iv(lo.rUpperArmRot, hi.rUpperArmRot); if (ru) r.rUpperArmRot = ru;
  const lu = iv(lo.lUpperArmRot, hi.lUpperArmRot); if (lu) r.lUpperArmRot = lu;
  const rf = iv(lo.rForearmRot?.slice(0,3) as any, hi.rForearmRot?.slice(0,3) as any); if (rf) r.rForearmRot = rf;
  const lf = iv(lo.lForearmRot, hi.lForearmRot); if (lf) r.lForearmRot = lf;
  const rh = iv(lo.rHipRot, hi.rHipRot); if (rh) r.rHipRot = rh;
  const lh = iv(lo.lHipRot, hi.lHipRot); if (lh) r.lHipRot = lh;
  const rt = iv(lo.rThighRot, hi.rThighRot); if (rt) r.rThighRot = rt;
  const lt = iv(lo.lThighRot, hi.lThighRot); if (lt) r.lThighRot = lt;
  const rc = iv(lo.rCalfRot, hi.rCalfRot); if (rc) r.rCalfRot = rc;
  const lc = iv(lo.lCalfRot, hi.lCalfRot); if (lc) r.lCalfRot = lc;
  const bb = iv(lo.barbellPos, hi.barbellPos); if (bb) r.barbellPos = bb;
  r.barbellVisible = (lo.barbellVisible || hi.barbellVisible) ?? false;
  return r;
};

export const FitnessAvatar3D: React.FC<Props> = ({ exerciseName, mode, className = '' }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1.0 | 1.5 | 2.0>(1.0);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [cameraPreset, setCameraPresetState] = useState<'front' | 'back' | 'side' | '45' | 'free'>('front');
  const [coachingEnabled, setCoachingEnabled] = useState(true);
  const [loadingThree, setLoadingThree] = useState(true);
  const [activeCue, setActiveCue] = useState('Standby');
  const [tempoPhase, setTempoPhase] = useState<'eccentric' | 'pause' | 'concentric' | 'top_pause'>('eccentric');
  const [animSource, setAnimSource] = useState<'network' | 'procedural'>('network');
  const [networkStatus, setNetworkStatus] = useState<'loading' | 'synced' | 'error'>('loading');

  const movementDBRef = useRef<MovementDB | null>(null);
  const animSourceRef = useRef<'network' | 'procedural'>('network');
  const cueRef = useRef('Standby');
  const phaseRef = useRef<'eccentric' | 'pause' | 'concentric' | 'top_pause'>('eccentric');
  const stateRef = useRef({
    playing: true, speed: 1.0,
    gender: 'male' as 'male' | 'female',
    cameraPreset: 'front' as 'front' | 'back' | 'side' | '45' | 'free',
    zoomFactor: 1.0, time: 0,
    currentExercise: '',
  });

  useEffect(() => {
    stateRef.current.playing = playing;
    stateRef.current.speed = speed;
    stateRef.current.gender = gender;
    stateRef.current.cameraPreset = cameraPreset;
  }, [playing, speed, gender, cameraPreset]);

  useEffect(() => { animSourceRef.current = animSource; }, [animSource]);
  useEffect(() => { stateRef.current.currentExercise = exerciseName; stateRef.current.time = 0; }, [exerciseName]);

  useEffect(() => {
    fetch('/data/exercise_movements.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<MovementDB>; })
      .then(d => { movementDBRef.current = d; setNetworkStatus('synced'); })
      .catch(() => { setNetworkStatus('error'); setAnimSource('procedural'); animSourceRef.current = 'procedural'; });
  }, []);

  useEffect(() => {
    const id = setInterval(() => { setActiveCue(cueRef.current); setTempoPhase(phaseRef.current); }, 120);
    return () => clearInterval(id);
  }, []);

  const handleRestart = () => { stateRef.current.time = 0; };
  const toggleSource = () => { setAnimSource(s => { const n = s === 'network' ? 'procedural' : 'network'; animSourceRef.current = n; return n; }); };
  const selectCamera = (p: typeof cameraPreset) => setCameraPresetState(p);

  useEffect(() => {
    let active = true;
    let cleanupFn = () => {};
    setLoadingThree(true);

    import('three').then(THREE => {
      if (!active || !mountRef.current) return;
      setLoadingThree(false);

      const W = mountRef.current.clientWidth || 500;
      const H = mountRef.current.clientHeight || 360;
      const scene = new THREE.Scene();
      scene.background = null;
      const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
      cam.position.set(0, 1.2, 4.2);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mountRef.current.appendChild(renderer.domElement);
      const dom = renderer.domElement;
      dom.style.cursor = 'grab';

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));
      const kl = new THREE.DirectionalLight(0x22d3ee, 2.8); kl.position.set(4, 6, 4); kl.castShadow = true; kl.shadow.mapSize.set(1024, 1024); scene.add(kl);
      const fl = new THREE.DirectionalLight(0x8b5cf6, 2.0); fl.position.set(-4, 4, -4); scene.add(fl);
      const rl = new THREE.DirectionalLight(0x3b82f6, 2.5); rl.position.set(0, 3, -6); scene.add(rl);
      scene.add(new THREE.DirectionalLight(0x10b981, 1.0)).position.set(0, -5, 0);

      // Floor grid
      const grid = new THREE.GridHelper(10, 24, 0x10b981, 0x1e293b); grid.position.y = -0.8; scene.add(grid);

      // Ambient particles
      const pGrp = new THREE.Group(); scene.add(pGrp);
      const particles: any[] = [];
      const pMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.18 });
      const pGeo = new THREE.SphereGeometry(0.012, 4, 4);
      for (let i = 0; i < 30; i++) {
        const p = new THREE.Mesh(pGeo, pMat);
        p.position.set((Math.random()-0.5)*4, Math.random()*3.5-0.8, (Math.random()-0.5)*4);
        pGrp.add(p); particles.push(p);
      }

      // ── Materials ──
      const skinMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.88 });
      const femaleMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.28, metalness: 0.85 });
      const jointMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const accentMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 });

      const seg: Record<string, any> = {};
      const allBodyMeshes: any[] = [];

      const mkSeg = (name: string, r1: number, r2: number, len: number, parent: any, mat?: any) => {
        const g = new THREE.Group(); parent.add(g); seg[name] = g;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, 14), mat ?? skinMat);
        m.position.y = -len / 2; m.castShadow = true; g.add(m); seg[name + '_mesh'] = m;
        allBodyMeshes.push(m);
        const j = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r1, r2) * 1.3, 10, 10), jointMat); g.add(j);
        return g;
      };

      // ── Skeleton ──
      const body = new THREE.Group(); scene.add(body);

      // Torso — wider, taller, more athletic
      const chest = new THREE.Group(); chest.position.y = 0.62; body.add(chest); seg.chest = chest;
      const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.18, 0.44, 16), skinMat);
      chestMesh.castShadow = true; chest.add(chestMesh); seg.chest_mesh = chestMesh; allBodyMeshes.push(chestMesh);

      // Neck
      const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 10), skinMat);
      neckMesh.position.y = 0.28; chest.add(neckMesh); allBodyMeshes.push(neckMesh);

      // Head (slightly larger and more oval)
      const headGrp = new THREE.Group(); headGrp.position.y = 0.38; chest.add(headGrp); seg.head = headGrp;
      const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
      headGrp.add(headMesh); allBodyMeshes.push(headMesh);
      // Jaw/chin
      const chinMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), skinMat);
      chinMesh.position.set(0, -0.09, 0.07); headGrp.add(chinMesh); allBodyMeshes.push(chinMesh);

      // Waist
      const waist = new THREE.Group(); waist.position.y = -0.22; chest.add(waist); seg.waist = waist;
      const waistMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.195, 0.28, 16), skinMat);
      waistMesh.position.y = -0.14; waistMesh.castShadow = true; waist.add(waistMesh); seg.waist_mesh = waistMesh; allBodyMeshes.push(waistMesh);
      const pelvisMesh = new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 14), skinMat);
      pelvisMesh.position.y = -0.28; pelvisMesh.castShadow = true; waist.add(pelvisMesh); seg.pelvis = pelvisMesh; allBodyMeshes.push(pelvisMesh);

      // ── Arms ──
      const rSh = new THREE.Group(); chest.add(rSh); seg.rShoulder = rSh;
      const rUA = mkSeg('rUpperArm', 0.060, 0.050, 0.36, rSh);
      const rFA = mkSeg('rForearm',  0.050, 0.038, 0.32, rUA); rFA.position.y = -0.36;
      // Right hand
      const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.040, 10, 10), skinMat);
      rHand.position.y = -0.32; seg.rForearm.add(rHand); allBodyMeshes.push(rHand);

      const lSh = new THREE.Group(); chest.add(lSh); seg.lShoulder = lSh;
      const lUA = mkSeg('lUpperArm', 0.060, 0.050, 0.36, lSh);
      const lFA = mkSeg('lForearm',  0.050, 0.038, 0.32, lUA); lFA.position.y = -0.36;
      const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.040, 10, 10), skinMat);
      lHand.position.y = -0.32; seg.lForearm.add(lHand); allBodyMeshes.push(lHand);

      // ── Legs ──
      const rHip = new THREE.Group(); waist.add(rHip); seg.rHip = rHip;
      const rTh = mkSeg('rThigh', 0.085, 0.070, 0.46, rHip);
      const rCa = mkSeg('rCalf',  0.068, 0.052, 0.43, rTh); rCa.position.y = -0.46;
      // Right foot
      const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.06, 0.20), accentMat);
      rFoot.position.set(0, -0.455, 0.06); seg.rCalf.add(rFoot); allBodyMeshes.push(rFoot);

      const lHip = new THREE.Group(); waist.add(lHip); seg.lHip = lHip;
      const lTh = mkSeg('lThigh', 0.085, 0.070, 0.46, lHip);
      const lCa = mkSeg('lCalf',  0.068, 0.052, 0.43, lTh); lCa.position.y = -0.46;
      const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.06, 0.20), accentMat);
      lFoot.position.set(0, -0.455, 0.06); seg.lCalf.add(lFoot); allBodyMeshes.push(lFoot);

      // ── Barbell ──
      const barbell = new THREE.Group(); scene.add(barbell);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.9), accentMat);
      bar.rotation.z = Math.PI / 2; barbell.add(bar);
      const mkPlate = (xPos: number) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.09, 16), accentMat);
        p.position.x = xPos; p.rotation.z = Math.PI / 2; barbell.add(p);
      };
      mkPlate(0.84); mkPlate(-0.84);
      barbell.visible = false;

      // ── Mouse / Touch orbit ──
      let drag = false, prevX = 0, prevY = 0, rotX = 0, rotY = 0.06;
      const onMD = (e: MouseEvent) => { drag = true; prevX = e.clientX; prevY = e.clientY; };
      const onMM = (e: MouseEvent) => {
        if (!drag) return;
        rotX -= (e.clientX - prevX) * 0.007; rotY = Math.max(-1.3, Math.min(1.3, rotY + (e.clientY - prevY) * 0.007));
        prevX = e.clientX; prevY = e.clientY;
        stateRef.current.cameraPreset = 'free'; setCameraPresetState('free');
      };
      const onMU = () => { drag = false; };
      dom.addEventListener('mousedown', onMD); dom.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU);

      let tX = 0, tY = 0;
      const onTS = (e: TouchEvent) => { if (e.touches.length === 1) { drag = true; tX = e.touches[0].clientX; tY = e.touches[0].clientY; } };
      const onTM = (e: TouchEvent) => {
        if (!drag || e.touches.length !== 1) return;
        rotX -= (e.touches[0].clientX - tX) * 0.007; rotY = Math.max(-1.3, Math.min(1.3, rotY + (e.touches[0].clientY - tY) * 0.007));
        tX = e.touches[0].clientX; tY = e.touches[0].clientY;
        stateRef.current.cameraPreset = 'free'; setCameraPresetState('free');
      };
      const onTE = () => { drag = false; };
      dom.addEventListener('touchstart', onTS, { passive: true }); dom.addEventListener('touchmove', onTM, { passive: true }); dom.addEventListener('touchend', onTE);

      const presets: Record<string, any> = {
        front: new THREE.Vector3(0, 1.2, 4.2), back: new THREE.Vector3(0, 1.2, -4.2),
        side: new THREE.Vector3(4.2, 1.2, 0), '45': new THREE.Vector3(3.0, 1.2, 3.0), free: new THREE.Vector3(0, 1.2, 4.2),
      };

      // ── Apply frame to skeleton ──
      const applyFrame = (fr: Partial<MovementFrame>) => {
        if (fr.bodyPos) body.position.set(...fr.bodyPos);
        if (fr.bodyRot) body.rotation.set(...fr.bodyRot);
        if (fr.waistRot) waist.rotation.set(...fr.waistRot);
        if (fr.headRot) headGrp.rotation.set(...fr.headRot);
        if (fr.rShoulderRot) rSh.rotation.set(...fr.rShoulderRot);
        if (fr.lShoulderRot) lSh.rotation.set(...fr.lShoulderRot);
        if (fr.rUpperArmRot) rUA.rotation.set(...fr.rUpperArmRot);
        if (fr.lUpperArmRot) lUA.rotation.set(...fr.lUpperArmRot);
        if (fr.rForearmRot) rFA.rotation.set(...(fr.rForearmRot.slice(0, 3) as [number, number, number]));
        if (fr.lForearmRot) lFA.rotation.set(...fr.lForearmRot);
        if (fr.rHipRot) rHip.rotation.set(...fr.rHipRot);
        if (fr.lHipRot) lHip.rotation.set(...fr.lHipRot);
        if (fr.rThighRot) rTh.rotation.set(...fr.rThighRot);
        if (fr.lThighRot) lTh.rotation.set(...fr.lThighRot);
        if (fr.rCalfRot) rCa.rotation.set(...fr.rCalfRot);
        if (fr.lCalfRot) lCa.rotation.set(...fr.lCalfRot);
        if (fr.barbellPos) barbell.position.set(...fr.barbellPos);
        barbell.visible = fr.barbellVisible ?? false;
      };

      const CUES: Record<string, [string, string, string, string]> = {
        'squat':           ['Sit back — keep chest up',          'Hold at parallel — brace core',         'Drive through heels — knees out',   'Squeeze glutes at the top'],
        'bench press':     ['Controlled descent — retract scaps', 'Touch bar to lower chest',              'Drive bar up — arch maintained',     'Lock out — squeeze pecs'],
        'deadlift':        ['Hinge hips back — bar stays close',  'Maintain flat back at bottom',          'Push floor away — hips forward',     'Stand tall — glutes locked'],
        'pull up':         ['Dead hang — full extension',         'Brace core — initiate with lats',       'Lead elbows down — chest to bar',    'Peak squeeze — chin above bar'],
        'shoulder press':  ['Lower bar to chin — elbows forward', 'Pause briefly at shoulder',             'Press vertically overhead',          'Lock out — full extension'],
        'row':             ['Stretch lats at full extension',     'Neutral spine — hinge maintained',      'Pull bar to lower sternum',          'Retract scapulae — hold 1 sec'],
        'lat pulldown':    ['Full stretch overhead — arms long',  'Initiate with lats not biceps',         'Pull elbows down and back',          'Squeeze lats at bottom — hold'],
        'bicep curl':      ['Control the descent — full stretch', 'Keep elbows pinned — no swinging',      'Supinate and squeeze at the top',    'Hold peak contraction'],
        'tricep extension':['Control to 90 degrees at elbow',     'Keep upper arms perfectly vertical',    'Extend forcefully — full lockout',   'Squeeze triceps at extension'],
        'push up':         ['Rigid plank — lower controlled',     'Chest hovering just above floor',       'Explosively push floor away',        'Lock elbows — hollow body'],
        'leg press':       ['Controlled eccentric — 90 deg min',  'Full depth — lower back flat on pad',   'Drive through full foot',            'Stop short of knee lockout'],
        'leg extension':   ['Control negative — full range',      'Pause at bottom — maintain tension',    'Extend to full lockout',             'Hold peak — quad squeeze'],
        'leg curl':        ['Control descent — full extension',   'Flat hips — don\'t arch lower back',   'Curl heels to glutes fully',         'Hold peak — hamstring squeeze'],
        'calf raise':      ['Deep stretch at bottom — heel low',  'Pause at bottom stretch',              'Drive up on big toe ball',           'Hold peak contraction 1 sec'],
        'plank':           ['Hollow body — ribs to hips',         'Breathe — no hip sagging',             'Squeeze abs and glutes simultaneously', 'Rigid plank — hold position'],
      };

      let rafId: number;

      const animate = () => {
        rafId = requestAnimationFrame(animate);
        const s = stateRef.current;
        const db = movementDBRef.current;
        const src = animSourceRef.current;

        // Gender material
        const isMale = s.gender === 'male';
        const mat = isMale ? skinMat : femaleMat;
        allBodyMeshes.forEach(m => { m.material = mat; });
        seg.rFoot?.material === mat; // feet keep accent material
        // Keep feet/accent in their material
        if (rFoot) rFoot.material = accentMat;
        if (lFoot) lFoot.material = accentMat;

        // Proportions (shoulder width differs by gender)
        if (isMale) {
          seg.chest_mesh?.scale.set(1, 1, 1);
          rSh.position.set(-0.34, 0.18, 0); lSh.position.set(0.34, 0.18, 0);
          rHip.position.set(-0.15, -0.24, 0); lHip.position.set(0.15, -0.24, 0);
        } else {
          seg.chest_mesh?.scale.set(0.83, 0.88, 0.82);
          rSh.position.set(-0.25, 0.15, 0); lSh.position.set(0.25, 0.15, 0);
          rHip.position.set(-0.19, -0.24, 0); lHip.position.set(0.19, -0.24, 0);
        }

        // Particles
        particles.forEach(p => {
          p.position.y += 0.0035 * s.speed;
          if (p.position.y > 2.5) { p.position.y = -0.8; p.position.x = (Math.random()-0.5)*4; p.position.z = (Math.random()-0.5)*4; }
        });

        // Time
        if (s.playing) s.time += 0.016 * s.speed;
        const t = s.time % 6.0;
        let phase: typeof phaseRef.current = 'eccentric'; let ratio = 0;
        if      (t < 3.0) { phase = 'eccentric';  ratio = t / 3.0; }
        else if (t < 3.5) { phase = 'pause';       ratio = 1.0; }
        else if (t < 5.0) { phase = 'concentric';  ratio = 1.0 - (t - 3.5) / 1.5; }
        else              { phase = 'top_pause';    ratio = 0.0; }
        phaseRef.current = phase;
        let cv = ratio;
        if (phase === 'concentric') cv = cv * cv; // explosive concentric

        // ── DEFAULT RESET — BASE_Y grounds the model so feet touch the floor ──
        body.position.set(0, BASE_Y, 0);
        body.rotation.set(0, 0, 0);
        headGrp.rotation.set(0, 0, 0);
        rSh.rotation.set(0, 0, 0); lSh.rotation.set(0, 0, 0);
        rUA.rotation.set(0, 0, 0); lUA.rotation.set(0, 0, 0);
        rFA.rotation.set(0, 0, 0); lFA.rotation.set(0, 0, 0);
        rHip.rotation.set(0, 0, 0); lHip.rotation.set(0, 0, 0);
        rTh.rotation.set(0, 0, 0);  lTh.rotation.set(0, 0, 0);
        rCa.rotation.set(0, 0, 0);  lCa.rotation.set(0, 0, 0);
        waist.rotation.set(0, 0, 0); barbell.visible = false;

        const ex = s.currentExercise.toLowerCase();
        const phIdx = phase === 'eccentric' ? 0 : phase === 'pause' ? 1 : phase === 'concentric' ? 2 : 3;

        if (src === 'network' && db) {
          const key = resolveKey(ex, db);
          if (key && db[key]) {
            applyFrame(interpolateFrames(db[key], cv));
            cueRef.current = (CUES[key] ?? ['Maintain form','Breathe steady','Drive through','Hold position'])[phIdx];
          } else {
            applyProcedural(ex, cv, phase, s, body, waist, headGrp, rSh, lSh, rUA, lUA, rFA, lFA, rHip, lHip, rTh, lTh, rCa, lCa, barbell, cueRef);
          }
        } else {
          applyProcedural(ex, cv, phase, s, body, waist, headGrp, rSh, lSh, rUA, lUA, rFA, lFA, rHip, lHip, rTh, lTh, rCa, lCa, barbell, cueRef);
        }

        // Camera
        if (s.cameraPreset !== 'free') {
          const tgt = presets[s.cameraPreset] ?? presets.front;
          cam.position.lerp(tgt, 0.05);
        } else {
          const r = 4.2 * s.zoomFactor;
          cam.position.set(Math.sin(rotX)*Math.cos(rotY)*r, 0.5+Math.sin(rotY)*r, Math.cos(rotX)*Math.cos(rotY)*r);
        }
        cam.lookAt(0, 0.3, 0);
        renderer.render(scene, cam);
      };

      animate();

      const onResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight;
        cam.aspect = w / h; cam.updateProjectionMatrix(); renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      cleanupFn = () => {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(rafId);
        dom.removeEventListener('mousedown', onMD); dom.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU);
        dom.removeEventListener('touchstart', onTS); dom.removeEventListener('touchmove', onTM); dom.removeEventListener('touchend', onTE);
        if (mountRef.current?.contains(dom)) mountRef.current.removeChild(dom);
        scene.traverse((obj: any) => { if (obj.isMesh) { obj.geometry.dispose(); if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose()); else obj.material.dispose(); } });
        skinMat.dispose(); femaleMat.dispose(); jointMat.dispose(); accentMat.dispose(); renderer.dispose();
      };
    });

    return () => { active = false; cleanupFn(); };
  }, []);

  return (
    <div className={`relative flex flex-col glass-panel overflow-hidden border border-white/10 ${className}`}>
      {loadingThree && (
        <div className="absolute inset-0 z-20 bg-dark-bg/60 backdrop-blur-md flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-cyan animate-spin" />
          <p className="text-xs text-slate-400">Rendering Athletic Studio...</p>
        </div>
      )}

      {/* Network badge */}
      <div className="absolute top-4 left-4 z-20">
        {networkStatus === 'loading' && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[9px] font-black uppercase text-amber-400">
            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
          </span>
        )}
        {networkStatus === 'synced' && animSource === 'network' && (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black uppercase text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />AI Stream
          </span>
        )}
        {(networkStatus === 'error' || (networkStatus === 'synced' && animSource === 'procedural')) && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[9px] font-black uppercase text-amber-400">
            <WifiOff className="w-3 h-3" /> Procedural
          </span>
        )}
      </div>

      <div ref={mountRef} className="w-full h-[280px] md:h-[350px] relative z-10" />

      {coachingEnabled && (
        <div className="absolute top-14 left-4 z-20 max-w-[280px] bg-dark-bg/85 border border-white/10 px-3 py-2 rounded-xl flex gap-2 items-start shadow-xl">
          <Sparkles className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Coach</span>
            <p className="text-[10px] text-white font-bold leading-relaxed">{activeCue}</p>
          </div>
        </div>
      )}

      {/* Camera presets */}
      <div className="absolute top-4 right-4 z-20 flex flex-wrap gap-1">
        {(['front','back','side','45','free'] as const).map(p => (
          <button key={p} onClick={() => selectCamera(p)}
            className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase transition-all ${cameraPreset===p?'bg-brand-cyan/20 border-brand-cyan/40 text-white':'bg-dark-bg/50 border-white/10 text-slate-400 hover:text-white'}`}>
            {p}{p === 'free' ? ' Orbit' : ''}
          </button>
        ))}
      </div>

      {/* Tempo bar */}
      <div className="px-4 pt-3 pb-1 relative z-20 bg-white/[0.01] border-t border-white/5 space-y-1">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold text-slate-400 flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5 text-brand-cyan" />Tempo</span>
          <span className="capitalize font-black text-brand-cyan flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-ping bg-brand-cyan" />{tempoPhase.replace('_',' ')}
          </span>
        </div>
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden flex">
          <div className="h-full bg-brand-rose transition-all duration-200" style={{width:tempoPhase==='eccentric'?'50%':'0%'}} />
          <div className="h-full bg-brand-purple transition-all duration-200" style={{width:tempoPhase==='pause'?'10%':'0%'}} />
          <div className="h-full bg-brand-cyan transition-all duration-200" style={{width:tempoPhase==='concentric'?'25%':'0%'}} />
          <div className="h-full bg-brand-emerald transition-all duration-200" style={{width:tempoPhase==='top_pause'?'15%':'0%'}} />
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-white/5 bg-white/[0.02] px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => setPlaying(p => !p)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan hover:bg-brand-cyan/25 transition-colors">
            {playing ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
          </button>
          <button onClick={handleRestart} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
            <RotateCw className="w-4 h-4"/>
          </button>
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-[9px] font-bold text-slate-400">
            {([0.5,1.0,1.5,2.0] as const).map(sp => (
              <button key={sp} onClick={() => setSpeed(sp)} className={`px-2 py-1 rounded-md transition-all ${speed===sp?'bg-brand-cyan/25 text-white':'hover:text-white'}`}>{sp}x</button>
            ))}
          </div>
          <button onClick={toggleSource} disabled={networkStatus !== 'synced'}
            className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${animSource==='network'&&networkStatus==='synced'?'bg-emerald-500/10 border-emerald-500/30 text-emerald-400':'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            {animSource==='network'?<Wifi className="w-3 h-3"/>:<Zap className="w-3 h-3"/>}
            {animSource==='network'?'AI Stream':'Procedural'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setGender(g => g==='male'?'female':'male')}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-brand-cyan/40 text-[9px] font-bold uppercase text-slate-400 hover:text-white transition-all flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-brand-cyan"/>{gender}
          </button>
          <button onClick={() => setCoachingEnabled(c => !c)}
            className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all ${coachingEnabled?'bg-brand-purple/15 border-brand-purple/35 text-brand-purple':'bg-white/5 border-white/10 text-slate-500'}`}>
            Coach: {coachingEnabled?'On':'Off'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Procedural fallback — all positions corrected for BASE_Y = -0.11 ──────────
function applyProcedural(
  ex: string, cv: number, phase: string, state: any,
  body: any, waist: any, head: any,
  rSh: any, lSh: any, rUA: any, lUA: any, rFA: any, lFA: any,
  rHip: any, lHip: any, rTh: any, lTh: any, rCa: any, lCa: any,
  barbell: any, cueRef: React.MutableRefObject<string>
) {
  const pi = phase==='eccentric'?0:phase==='pause'?1:phase==='concentric'?2:3;
  const BY = BASE_Y; // -0.11 ground offset

  if (ex.includes('push up')||ex.includes('push-up')||ex.includes('pushup')) {
    body.rotation.x=-Math.PI/2.2; body.position.y=BY-0.42-cv*0.20;
    rSh.rotation.z=-1.2; lSh.rotation.z=1.2;
    rFA.rotation.y=-0.15-cv*1.0; lFA.rotation.y=0.15+cv*1.0;
    cueRef.current=['Rigid plank — lower controlled','Chest hovering off floor','Explosively push floor away','Lock elbows — hollow body'][pi];
  } else if (ex.includes('pull up')||ex.includes('pull-up')||ex.includes('pullup')||ex.includes('chin')) {
    barbell.visible=true; barbell.position.set(0,1.4,0);
    body.position.y=BY+0.25-cv*0.70;
    rUA.rotation.z=-1.1-cv*1.75; lUA.rotation.z=1.1+cv*1.75;
    rFA.rotation.x=2.0-cv*1.9; lFA.rotation.x=2.0-cv*1.9;
    cueRef.current=['Dead hang — full extension','Initiate with lats','Lead elbows down — chest to bar','Peak squeeze — chin above bar'][pi];
  } else if (ex.includes('bench press')||ex.includes('chest press')||ex.includes('fly')||ex.includes('incline')||ex.includes('decline')) {
    body.rotation.x=-Math.PI/2; body.position.y=BY-0.55;
    barbell.visible=true; barbell.position.y=0.57-cv*0.30;
    rSh.rotation.z=-1.4; lSh.rotation.z=1.4;
    rUA.rotation.y=-0.2-cv*0.5; lUA.rotation.y=0.2+cv*0.5;
    rFA.rotation.z=0.1+cv*0.85; lFA.rotation.z=-0.1-cv*0.85;
    cueRef.current=['Controlled descent — retract scaps','Touch bar to lower chest','Drive bar up — arch maintained','Lock out — squeeze pecs'][pi];
  } else if (ex.includes('squat')||ex.includes('lunge')||ex.includes('bulgarian')||ex.includes('goblet')) {
    body.position.y=BY-cv*0.52; body.position.z=-cv*0.17;
    waist.rotation.x=cv*0.65;
    rTh.rotation.x=-cv*1.65; rTh.rotation.z=cv*0.22;
    lTh.rotation.x=-cv*1.65; lTh.rotation.z=-cv*0.22;
    rCa.rotation.x=cv*1.60; lCa.rotation.x=cv*1.60;
    barbell.visible=true; barbell.position.set(0,BY+0.75-cv*0.52,-0.12);
    cueRef.current=['Sit back — keep chest up','Hold parallel — brace core','Drive through heels — knees out','Squeeze glutes at the top'][pi];
  } else if (ex.includes('deadlift')||ex.includes('hip thrust')||ex.includes('rdl')||ex.includes('romanian')||ex.includes('hinge')) {
    barbell.visible=true;
    body.position.y=BY-cv*0.38; body.position.z=-cv*0.25;
    waist.rotation.x=cv*1.20;
    rTh.rotation.x=-cv*0.58; lTh.rotation.x=-cv*0.58;
    rCa.rotation.x=cv*0.78; lCa.rotation.x=cv*0.78;
    rUA.rotation.x=-cv*0.75; lUA.rotation.x=-cv*0.75;
    barbell.position.set(0,BY+0.55-cv*0.85,0.25);
    cueRef.current=['Hinge hips back — bar stays close','Maintain flat back at bottom','Push floor away — hips forward','Stand tall — glutes locked'][pi];
  } else if (ex.includes('shoulder press')||ex.includes('overhead press')||ex.includes('military press')||ex.includes('ohp')||ex.includes('arnold')) {
    barbell.visible=true; barbell.position.y=BY+0.72-cv*0.63;
    rUA.rotation.z=-2.85+cv*2.45; lUA.rotation.z=2.85-cv*2.45;
    rFA.rotation.x=0.1+cv*1.5; lFA.rotation.x=0.1+cv*1.5;
    cueRef.current=['Lower bar to chin — elbows forward','Pause at shoulder height','Press vertically overhead','Lock out — full extension'][pi];
  } else if (ex.includes('tricep')||ex.includes('pushdown')||ex.includes('skull')||ex.includes('kickback')||ex.includes('overhead extension')) {
    rUA.rotation.x=0.10; lUA.rotation.x=0.10;
    rFA.rotation.x=1.57-cv*1.49; lFA.rotation.x=1.57-cv*1.49;
    cueRef.current=['Control to 90 degrees at elbow','Keep upper arms vertical','Extend forcefully — full lockout','Squeeze triceps at extension'][pi];
  } else if (ex.includes('bicep')||ex.includes('hammer curl')||(ex.includes('curl')&&!ex.includes('leg'))) {
    rUA.rotation.x=0.15; lUA.rotation.x=0.15;
    rFA.rotation.x=0.10+cv*2.15; lFA.rotation.x=0.10+cv*2.15;
    cueRef.current=['Control descent — full stretch','Elbows pinned — no swinging','Supinate and squeeze at top','Hold peak contraction'][pi];
  } else if (ex.includes('leg press')) {
    body.rotation.x=-Math.PI/4; body.position.y=BY-0.20;
    rHip.rotation.x=-0.2-cv*1.05; lHip.rotation.x=-0.2-cv*1.05;
    rTh.rotation.x=cv*0.78; lTh.rotation.x=cv*0.78;
    rCa.rotation.x=0.10+cv*1.55; lCa.rotation.x=0.10+cv*1.55;
    cueRef.current=['Controlled 90 deg min eccentric','Full depth — lower back flat','Drive through full foot','Stop short of knee lockout'][pi];
  } else if (ex.includes('lat pulldown')||ex.includes('pulldown')) {
    barbell.visible=true; barbell.position.y=BY+1.40-cv*0.52;
    rUA.rotation.z=-2.85+cv*2.10; lUA.rotation.z=2.85-cv*2.10;
    rFA.rotation.x=0.10+cv*1.75; lFA.rotation.x=0.10+cv*1.75;
    cueRef.current=['Full stretch overhead','Initiate with lats not biceps','Pull elbows down and back','Squeeze lats at bottom — hold'][pi];
  } else if (ex.includes('row')) {
    barbell.visible=true; barbell.position.set(0,BY+0.40,0.65-cv*0.45);
    waist.rotation.x=0.25-cv*0.33;
    rUA.rotation.x=-0.55+cv*1.40; lUA.rotation.x=-0.55+cv*1.40;
    rFA.rotation.x=0.10+cv*1.50; lFA.rotation.x=0.10+cv*1.50;
    cueRef.current=['Stretch lats at full extension','Neutral spine maintained','Pull bar to lower sternum','Retract scapulae — hold 1s'][pi];
  } else if (ex.includes('leg extension')) {
    body.position.y=BY+0.20;
    rCa.rotation.x=1.50-cv*1.46; lCa.rotation.x=1.50-cv*1.46;
    cueRef.current=['Control negative — full range','Pause at bottom — maintain tension','Extend to full lockout','Hold peak — quad squeeze'][pi];
  } else if (ex.includes('leg curl')||(ex.includes('curl')&&ex.includes('leg'))) {
    body.rotation.x=-Math.PI/2; body.position.y=BY-0.60;
    rCa.rotation.x=0.08+cv*1.97; lCa.rotation.x=0.08+cv*1.97;
    cueRef.current=['Control descent — full extension','Flat hips — no arch','Curl heels to glutes fully','Hold peak — hamstring squeeze'][pi];
  } else if (ex.includes('calf')) {
    body.position.y=BY-0.20+cv*0.12;
    rCa.rotation.z=0.20-cv*0.52; lCa.rotation.z=-0.20+cv*0.52;
    cueRef.current=['Deep stretch — heel below platform','Pause at bottom stretch','Drive up on big toe ball','Hold peak contraction 1s'][pi];
  } else {
    // Default plank
    body.rotation.x=-Math.PI/2.2; body.position.y=BY-0.52;
    rSh.rotation.z=-1.0; lSh.rotation.z=1.0;
    body.position.y += Math.sin(state.time*8)*0.008;
    cueRef.current='Rigid plank — pull belly to spine';
  }
}
