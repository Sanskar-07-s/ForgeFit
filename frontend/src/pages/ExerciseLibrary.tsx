// ForgeFit AI - Exercise Library & 2D/3D Anatomy Page (v4.3)

import React, { useState, useEffect, useRef } from 'react';
import { useFitnessData } from '../context/FitnessDataContext';
import { Exercise } from '@shared/types';
import * as THREE from 'three';
import { 
  Search, 
  Dumbbell, 
  Sparkles, 
  Maximize2, 
  RotateCw, 
  Eye, 
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

export default function ExerciseLibrary() {
  const { exercises } = useFitnessData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');

  // Tabs: Library List, 2D Anatomy, 3D Anatomy
  const [activeTab, setActiveTab] = useState<'library' | 'anatomy2d' | 'anatomy3d'>('library');

  // Detail Modal
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // 3D Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Filters logic
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMuscle = !selectedMuscle || ex.muscle_group.toLowerCase().includes(selectedMuscle.toLowerCase());
    
    const matchesDifficulty = selectedDifficulty === 'All' || ex.difficulty === selectedDifficulty;
    
    const matchesEquipment = selectedEquipment === 'All' || ex.equipment === selectedEquipment;

    return matchesSearch && matchesMuscle && matchesDifficulty && matchesEquipment;
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
    <div className="space-y-6">
      
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Exercise Resource Catalog</h2>
          <p className="text-xs text-slate-400">Filter exercises using 2D/3D anatomy muscle maps</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl text-xs font-bold">
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'library' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Library List
          </button>
          <button 
            onClick={() => setActiveTab('anatomy2d')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'anatomy2d' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2D anatomy
          </button>
          <button 
            onClick={() => setActiveTab('anatomy3d')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'anatomy3d' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3D Mannequin
          </button>
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
        <div className="space-y-6 animate-fade-in">
          {/* Controls filtering bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <input 
                type="text" 
                placeholder="Search exercise..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="glass-input pl-12"
              />
            </div>
            
            {/* Target muscle selection details */}
            <div>
              <select
                value={selectedMuscle || 'All'}
                onChange={e => setSelectedMuscle(e.target.value === 'All' ? null : e.target.value)}
                className="glass-input"
              >
                <option value="All">All Muscle Groups</option>
                <option value="Chest">Chest</option>
                <option value="Upper Chest">Upper Chest</option>
                <option value="Lower Chest">Lower Chest</option>
                <option value="Lats">Lats</option>
                <option value="Lower Back">Lower Back</option>
                <option value="Shoulders">Shoulders / Delts</option>
                <option value="Biceps">Biceps</option>
                <option value="Triceps">Triceps</option>
                <option value="Quads">Quads</option>
                <option value="Hamstrings">Hamstrings</option>
                <option value="Calves">Calves</option>
                <option value="Abs">Abs</option>
              </select>
            </div>

            <div>
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                className="glass-input"
              >
                <option value="All">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <select
                value={selectedEquipment}
                onChange={e => setSelectedEquipment(e.target.value)}
                className="glass-input"
              >
                <option value="All">All Equipments</option>
                <option value="Full Gym">Full Gym</option>
                <option value="Dumbbells">Dumbbells</option>
                <option value="Bands">Resistance Bands</option>
                <option value="Bodyweight">Bodyweight Only</option>
              </select>
            </div>
          </div>

          {/* Library Cards list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredExercises.map((ex) => (
              <div 
                key={ex.id} 
                onClick={() => setDetailExercise(ex)}
                className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">{ex.muscle_group}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{ex.difficulty}</span>
                  </div>
                  <h4 className="font-extrabold text-white text-base mt-3">{ex.name}</h4>
                  <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">{ex.description || 'No description available.'}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-brand-blue font-bold mt-4 uppercase">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl text-slate-500 font-bold text-xs">
              No exercises match your filter constraints. Clear filters to browse.
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
