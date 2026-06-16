// ForgeFit AI - Exercise Library (v5.0) — Premium Discovery

import React, { useState, useEffect, useRef } from 'react';
import { useFitnessData } from '../context/FitnessDataContext';
import { Exercise } from '@shared/types';
import * as THREE from 'three';
import {
  Search,
  Dumbbell,
  Sparkles,
  ChevronRight,
  X,
  Clock,
  TrendingUp,
  Layers,
} from 'lucide-react';

const POPULAR_SEARCHES = ['Bench Press','Squat','Deadlift','Pull-Ups','Shoulder Press','Plank','Bicep Curl','Lunges'];
const MUSCLE_CHIPS = ['All','Chest','Back','Shoulders','Biceps','Triceps','Legs','Abs','Calves'];

export default function ExerciseLibrary() {
  const { exercises } = useFitnessData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('forgefit_recent_searches') || '[]'); } catch { return []; }
  });
  const [searchFocused, setSearchFocused] = useState(false);

  const [activeTab, setActiveTab] = useState<'library' | 'anatomy2d' | 'anatomy3d'>('library');
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const commitSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(r => r !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('forgefit_recent_searches', JSON.stringify(updated));
    setSearchQuery(query);
    setSearchFocused(false);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('forgefit_recent_searches');
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = !searchQuery ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle   = selectedMuscle === 'All' || ex.muscle_group.toLowerCase().includes(selectedMuscle.toLowerCase());
    const matchesDiff     = selectedDifficulty === 'All' || ex.difficulty === selectedDifficulty;
    const matchesEquip    = selectedEquipment === 'All' || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesDiff && matchesEquip;
  });

  // 3D Anatomy Three.js Mannequin setup
  useEffect(() => {
    if (activeTab !== 'anatomy3d' || !canvasRef.current) return () => {};

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0c13');

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x2563eb, 0.6); // electric blue highlight light
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Mannequin Group
    const mannequin = new THREE.Group();

    // Materials
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x334155, 
      roughness: 0.5,
      metalness: 0.2
    });
    
    const highlightMat = new THREE.MeshStandardMaterial({ 
      color: 0x2563eb, 
      emissive: 0x2563eb,
      emissiveIntensity: 0.3,
      roughness: 0.3
    });

    const bodyParts: Record<string, THREE.Mesh> = {};

    // 1. Head
    const headGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const head = new THREE.Mesh(headGeo, baseMat);
    head.position.y = 2.1;
    mannequin.add(head);

    // 2. Chest (Upper cylinder)
    const chestGeo = new THREE.CylinderGeometry(0.6, 0.5, 0.9, 16);
    const chest = new THREE.Mesh(chestGeo, baseMat);
    chest.position.y = 1.3;
    chest.name = 'Chest';
    mannequin.add(chest);
    bodyParts['Chest'] = chest;

    // 3. Abs (Lower cylinder)
    const absGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.8, 16);
    const abs = new THREE.Mesh(absGeo, baseMat);
    abs.position.y = 0.5;
    abs.name = 'Abs';
    mannequin.add(abs);
    bodyParts['Abs'] = abs;

    // 4. Arms Left & Right (Cylinders)
    const leftArmGeo = new THREE.CylinderGeometry(0.18, 0.15, 1.2, 16);
    const leftArm = new THREE.Mesh(leftArmGeo, baseMat);
    leftArm.position.set(0.9, 1.1, 0);
    leftArm.rotation.z = -0.2;
    leftArm.name = 'Arms';
    mannequin.add(leftArm);
    bodyParts['LeftArm'] = leftArm;

    const rightArmGeo = new THREE.CylinderGeometry(0.18, 0.15, 1.2, 16);
    const rightArm = new THREE.Mesh(rightArmGeo, baseMat);
    rightArm.position.set(-0.9, 1.1, 0);
    rightArm.rotation.z = 0.2;
    rightArm.name = 'Arms';
    mannequin.add(rightArm);
    bodyParts['RightArm'] = rightArm;

    // 5. Thighs Legs Left & Right
    const leftLegGeo = new THREE.CylinderGeometry(0.25, 0.18, 1.3, 16);
    const leftLeg = new THREE.Mesh(leftLegGeo, baseMat);
    leftLeg.position.set(0.35, -0.6, 0);
    leftLeg.name = 'Legs';
    mannequin.add(leftLeg);
    bodyParts['LeftLeg'] = leftLeg;

    const rightLegGeo = new THREE.CylinderGeometry(0.25, 0.18, 1.3, 16);
    const rightLeg = new THREE.Mesh(rightLegGeo, baseMat);
    rightLeg.position.set(-0.35, -0.6, 0);
    rightLeg.name = 'Legs';
    mannequin.add(rightLeg);
    bodyParts['RightLeg'] = rightLeg;

    scene.add(mannequin);

    // Mouse drag controls rotation X/Y
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        // Raycasting for hover highlights
        const rect = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const intersects = raycaster.intersectObjects(mannequin.children);

        // Reset materials
        mannequin.children.forEach(child => {
          if (child instanceof THREE.Mesh) child.material = baseMat;
        });

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hit instanceof THREE.Mesh && hit.name) {
            // Sibling parts highlighting
            mannequin.children.forEach(child => {
              if (child instanceof THREE.Mesh && child.name === hit.name) {
                child.material = highlightMat;
              }
            });
          }
        }
        return;
      }

      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      
      mannequin.rotation.y += deltaX * 0.005;
      mannequin.rotation.x += deltaY * 0.005;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(mannequin.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.name) {
          setSelectedMuscle(hit.name);
          setActiveTab('library'); // switch back to see matched exercises
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleMouseClick);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Idle slow spin if not dragging
      if (!isDragging) {
        mannequin.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleMouseClick);
    };
  }, [activeTab]);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Exercise Library</h1>
          <p className="text-xs text-slate-500 mt-0.5">Find exercises by muscle, equipment, or difficulty</p>
        </div>
        <div className="flex p-1 rounded-xl gap-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['library','anatomy2d','anatomy3d'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={activeTab === tab ? { background: 'linear-gradient(135deg,#22D3EE,#8B5CF6)' } : undefined}
            >
              {tab === 'library' ? 'Library' : tab === 'anatomy2d' ? '2D Map' : '3D Model'}
            </button>
          ))}
        </div>
      </div>

      {/* active tab content */}
      {activeTab === 'anatomy3d' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 text-center">
          <div>
            <h3 className="font-bold text-base text-white">3D Mannequin Muscle Highlights</h3>
            <p className="text-xs text-slate-400">Click and drag model to rotate. Click muscle segments to filter targeted library items.</p>
          </div>
          <div className="relative w-full max-w-lg h-96 mx-auto rounded-2xl overflow-hidden border border-white/5 shadow-inner">
            <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          </div>
        </div>
      )}

      {activeTab === 'anatomy2d' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 text-center space-y-6">
          <div>
            <h3 className="font-bold text-base text-white">2D Interactive Muscle Outlines</h3>
            <p className="text-xs text-slate-400">Select targeted muscle group to load matched exercises.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-xl mx-auto">
            {['Chest', 'Upper Chest', 'Lower Chest', 'Lats', 'Lower Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Calves', 'Abs'].map((m) => {
              const selected = selectedMuscle?.toLowerCase() === m.toLowerCase();
              return (
                <button
                  key={m}
                  onClick={() => {
                    setSelectedMuscle(selected ? null : m);
                    setActiveTab('library');
                  }}
                  className={`p-3 text-xs font-bold rounded-xl border text-center transition-all ${
                    selected ? 'border-brand-blue bg-brand-blue/15 text-brand-blue shadow-glow-blue' : 'border-white/5 bg-white/5 hover:border-white/10'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="space-y-5 animate-fade-in">

          {/* ── Search bar with glow focus ── */}
          <div className="relative">
            <Search className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search exercises, muscles, or movements…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={e => { if (e.key === 'Enter' && searchQuery) commitSearch(searchQuery); }}
              className="glass-input pl-12 pr-4 py-3.5 text-sm"
              style={{ fontSize: '14px' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Dropdown: recent + popular */}
            {searchFocused && !searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 glass-panel rounded-2xl overflow-hidden shadow-lift p-4 space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Recent</span>
                      <button onClick={clearRecent} className="text-[10px] text-slate-600 hover:text-brand-rose">Clear</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map(r => (
                        <button key={r} onClick={() => commitSearch(r)} className="chip text-xs">{r}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2"><TrendingUp className="w-3.5 h-3.5" /> Popular</span>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map(s => (
                      <button key={s} onClick={() => commitSearch(s)} className="chip text-xs">{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Muscle Group chips (horizontal scroll) ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MUSCLE_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setSelectedMuscle(chip)}
                className={`chip shrink-0 text-xs ${selectedMuscle === chip ? 'chip-active' : ''}`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* ── Secondary filters row ── */}
          <div className="flex gap-3 flex-wrap">
            <select value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)} className="glass-input text-xs py-2" style={{ width: 'auto' }}>
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select value={selectedEquipment} onChange={e => setSelectedEquipment(e.target.value)} className="glass-input text-xs py-2" style={{ width: 'auto' }}>
              <option value="All">All Equipment</option>
              <option value="Full Gym">Full Gym</option>
              <option value="Dumbbells">Dumbbells</option>
              <option value="Bands">Bands</option>
              <option value="Bodyweight">Bodyweight</option>
            </select>
            <div className="flex items-center text-xs text-slate-500 font-medium ml-auto">
              {filteredExercises.length} exercises
            </div>
          </div>

          {/* ── Exercise Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredExercises.map(ex => (
              <div
                key={ex.id}
                onClick={() => setDetailExercise(ex)}
                className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22D3EE' }}>
                      {ex.muscle_group}
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold">{ex.difficulty}</span>
                  </div>
                  <h4 className="font-extrabold text-white text-base mt-3">{ex.name}</h4>
                  <p className="text-slate-500 text-xs mt-1.5 line-clamp-2">{ex.description || 'No description available.'}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-brand-cyan font-bold mt-4">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="py-16 text-center rounded-3xl" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
              <Dumbbell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold text-sm">No exercises match your filters.</p>
              <button onClick={() => { setSearchQuery(''); setSelectedMuscle('All'); setSelectedDifficulty('All'); setSelectedEquipment('All'); }} className="mt-4 glass-btn-secondary text-xs py-2 px-4">Clear All Filters</button>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL SCREEN */}
      {detailExercise && (
        <div className="fixed inset-0 z-50 bg-[#090a0f]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-panel p-6 rounded-3xl border border-white/5 space-y-6 relative overflow-y-auto max-h-[90vh]">
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">{detailExercise.muscle_group}</span>
                <h3 className="font-extrabold text-2xl text-white mt-2">{detailExercise.name}</h3>
              </div>
              <button 
                onClick={() => setDetailExercise(null)}
                className="px-3 py-1.5 bg-white/5 rounded-xl text-slate-400 font-bold text-xs"
              >
                Close
              </button>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">{detailExercise.description}</p>

            {/* Instruction steps list */}
            {detailExercise.instructions && detailExercise.instructions.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Execution Steps:</h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                  {detailExercise.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Equipment Required:</h4>
                <p className="text-slate-300 mt-1">{detailExercise.equipment}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Difficulty Level:</h4>
                <p className="text-slate-300 mt-1">{detailExercise.difficulty}</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
