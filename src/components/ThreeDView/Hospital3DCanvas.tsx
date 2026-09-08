import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useHospitalStore } from '../../store/hospitalStore';
import { Bed } from '../../types/hospital';
import { Eye, RotateCcw, Info, Filter, Building, Wind, Droplet, Sparkles, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audioEngine';
import { HospitalFacilityStructure } from './HospitalFacilityStructure';
import { BedContextMenu } from '../modals/BedContextMenu';
import { ERWaitingQueue } from '../modules/ERWaitingQueue';

interface TooltipData {
  x: number;
  y: number;
  bed: Bed;
  patientName?: string;
  diagnosis?: string;
  acuity?: number;
}

interface Hospital3DCanvasProps {
  onOpenComms?: (targetId?: string) => void;
  onOpenOxygen?: () => void;
  onOpenBlood?: () => void;
}

export const Hospital3DCanvas: React.FC<Hospital3DCanvasProps> = ({
  onOpenComms,
  onOpenOxygen,
  onOpenBlood
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    beds,
    patients,
    selectedBedId,
    setSelectedBedId,
    currentHospital,
    actualHospitalTotalBeds,
    actualHospitalOccupiedBeds,
    actualHospitalAvailableBeds,
    actualHospitalIcuBeds,
    actualHospitalIcuOccupied,
    actualHospitalOccupancyPercent,
    language,
    predictiveOffsetHours,
    assignPatientToBed
  } = useHospitalStore();

  const [viewMode, setViewMode] = useState<'structure' | 'bed-matrix'>('bed-matrix');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, bedId: string } | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'icu' | 'ed'>('iso');
  const [bedFilter, setBedFilter] = useState<'all' | 'available' | 'occupied' | 'ghost' | 'icu'>('all');
  
  // Camera smooth navigation targets
  const targetCameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 34 });
  const targetCameraLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  // Force renderer resize when switching back to bed-matrix
  useEffect(() => {
    if (viewMode !== 'bed-matrix') return;
    const timer = setTimeout(() => {
      if (containerRef.current && rendererRef.current && cameraRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [viewMode]);

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bedMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  // Animation refs
  const ghostHalosRef = useRef<Array<{ mesh: THREE.Mesh; scale: number; speed: number; maxScale: number }>>([]);
  const ghostDiamondsRef = useRef<THREE.Mesh[]>([]);
  const uvSweepsRef = useRef<Array<{ bar: THREE.Mesh; cone: THREE.Mesh; baseZ: number }>>([]);
  const ecgCanvasesRef = useRef<Array<{ ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture; offset: number }>>([]);
  const breathingBlanketsRef = useRef<THREE.Mesh[]>([]);
  const availableAurasRef = useRef<THREE.Mesh[]>([]);

  // Camera orbit controls
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 34 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.016);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.95);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.3);
    mainLight.position.set(20, 35, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 1.6, 45);
    cyanPointLight.position.set(-8, 9, -4);
    scene.add(cyanPointLight);

    const purplePointLight = new THREE.PointLight(0xa855f7, 1.3, 45);
    purplePointLight.position.set(8, 9, 4);
    scene.add(purplePointLight);

    // Floor Foundation & High-Tech Grid
    const gridHelper = new THREE.GridHelper(52, 52, 0x1e293b, 0x0c1322);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Architectural Department Zones with Glass Partitions
    const createDepartmentZone = (
      name: string,
      x: number,
      z: number,
      w: number,
      d: number,
      colorHex: number,
      borderColorHex: number,
      tagText: string
    ) => {
      // Floor Plate
      const floorGeo = new THREE.PlaneGeometry(w, d);
      const floorMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(x, 0, z);
      floor.receiveShadow = true;
      scene.add(floor);

      // Border Neon Line
      const edges = new THREE.EdgesGeometry(floorGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: borderColorHex, linewidth: 2 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.rotation.x = -Math.PI / 2;
      wireframe.position.set(x, 0.02, z);
      scene.add(wireframe);

      // Glass Architectural Partitions
      const wallMat = new THREE.MeshStandardMaterial({
        color: borderColorHex,
        transparent: true,
        opacity: 0.16,
        roughness: 0.1,
        metalness: 0.85
      });
      const backWallGeo = new THREE.BoxGeometry(w, 1.6, 0.08);
      const backWall = new THREE.Mesh(backWallGeo, wallMat);
      backWall.position.set(x, 0.8, z - d / 2);
      scene.add(backWall);
    };

    // Instantiate Zones
    createDepartmentZone('Emergency Dept', -10.5, 0.5, 9, 13, 0x0284c7, 0x38bdf8, 'ED TRIAGE: 85%');
    createDepartmentZone('Intensive Care', 3.5, -10, 18, 5, 0xef4444, 0xf87171, 'ICU PODS: 90% CRITICAL');
    createDepartmentZone('Med-Surg Ward', 2, 2.5, 14, 13, 0x06b6d4, 0x22d3ee, 'INPATIENT CENSUS: 78%');
    createDepartmentZone('Step-Down Unit', 12, 0.5, 5, 13, 0xa855f7, 0xc084fc, 'MONITORED STEP-DOWN');

    // 60 FPS Kinetic Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const updateCameraPosition = () => {
      if (!cameraRef.current) return;
      
      // Lerp angles
      cameraAngleRef.current.theta += (targetCameraAngleRef.current.theta - cameraAngleRef.current.theta) * 0.08;
      cameraAngleRef.current.phi += (targetCameraAngleRef.current.phi - cameraAngleRef.current.phi) * 0.08;
      cameraAngleRef.current.radius += (targetCameraAngleRef.current.radius - cameraAngleRef.current.radius) * 0.08;

      // Lerp target
      cameraTargetRef.current.lerp(targetCameraLookAtRef.current, 0.08);

      const { theta, phi, radius } = cameraAngleRef.current;
      const target = cameraTargetRef.current;
      cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.position.y = target.y + radius * Math.cos(phi);
      cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.lookAt(target);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 1. Animate Ghost Bed Expanding Hazard Shockwaves
      ghostHalosRef.current.forEach(halo => {
        halo.scale += halo.speed;
        if (halo.scale > halo.maxScale) {
          halo.scale = 0.6;
        }
        halo.mesh.scale.set(halo.scale, halo.scale, halo.scale);
        (halo.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - halo.scale / halo.maxScale));
      });

      // 2. Animate Rotating 3D Hazard Diamonds above Ghost Beds
      ghostDiamondsRef.current.forEach(diamond => {
        diamond.rotation.y += 0.04;
        diamond.position.y = 1.6 + 0.12 * Math.sin(elapsedTime * 4);
      });

      // 3. Animate Robotic UV-C Disinfection Sweeps on Cleaning Beds
      uvSweepsRef.current.forEach((item, idx) => {
        const offsetZ = Math.sin(elapsedTime * 3.2 + idx) * 0.75;
        item.bar.position.z = item.baseZ + offsetZ;
        item.cone.position.z = item.baseZ + offsetZ;
        (item.bar.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.4 * Math.sin(elapsedTime * 6 + idx);
      });

      // 4. Animate Scrolling Lead II ECG Traces on Occupied Monitors
      ecgCanvasesRef.current.forEach(item => {
        item.offset = (item.offset + 2) % 128;
        const { ctx, texture } = item;
        ctx.fillStyle = '#030814';
        ctx.fillRect(0, 0, 128, 64);

        // ECG Grid
        ctx.strokeStyle = '#062638';
        ctx.lineWidth = 0.8;
        for (let x = 0; x < 128; x += 16) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 64); ctx.stroke();
        }

        // Live ECG Lead II Trace
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        for (let x = 0; x < 128; x++) {
          const px = (x + item.offset) % 64;
          let y = 32;
          if (px > 24 && px < 28) y = 32 + (px - 26) * 4; // Q wave
          else if (px >= 28 && px < 33) y = 14; // R peak
          else if (px >= 33 && px < 36) y = 46; // S wave
          else if (px >= 42 && px < 50) y = 27; // T wave
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        texture.needsUpdate = true;
      });

      // 5. Animate Subtle Patient Respiration on Blankets
      breathingBlanketsRef.current.forEach((blanket, idx) => {
        const breath = 1.0 + 0.04 * Math.sin(elapsedTime * 2.5 + idx);
        blanket.scale.set(1.0, breath, 1.0);
      });

      // 6. Animate Available Beds Soft Mint Breathing Aura
      availableAurasRef.current.forEach((aura, idx) => {
        (aura.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.2 * Math.sin(elapsedTime * 2.2 + idx);
      });

      updateCameraPosition();
      renderer.render(scene, camera);
    };

    animate();

    // Resize observer & listener
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      if (newW <= 0 || newH <= 0) return;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Bed Meshes when beds/state changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous beds and animated refs
    bedMeshesRef.current.forEach(group => scene.remove(group));
    bedMeshesRef.current.clear();
    ghostHalosRef.current = [];
    ghostDiamondsRef.current = [];
    uvSweepsRef.current = [];
    ecgCanvasesRef.current = [];
    breathingBlanketsRef.current = [];
    availableAurasRef.current = [];

    // Purpose-Driven Materials Dictionary (Matching Concept Design)
    const materials = {
      available: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.2 }),
      occupied: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.25 }),
      ghost: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.4 }),
      cleaning: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, metalness: 0.3 }),
      reserved: new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3, metalness: 0.3 }),
      frame: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 }),
      mattress: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }),
      pillow: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 })
    };

    beds.forEach(bed => {
      // Predictive Time Scrubber Logic Override
      let effectiveStatus = bed.status;
      if (predictiveOffsetHours && predictiveOffsetHours > 0) {
        // Deterministic pseudo-random seed based on bed ID
        const seed = bed.id.charCodeAt(bed.id.length - 1) + (bed.id.charCodeAt(bed.id.length - 2) || 0);
        // At +24 hours, ~60% of beds might flip status
        const flipThreshold = predictiveOffsetHours * 2.5; 
        if (seed % 100 < flipThreshold) {
          if (bed.status === 'available' || bed.status === 'cleaning') effectiveStatus = 'occupied';
          else if (bed.status === 'occupied') effectiveStatus = 'available';
        }
      }

      // Override bed object for rendering
      const renderBed = { ...bed, status: effectiveStatus };

      const group = new THREE.Group();
      group.position.set(renderBed.position3D[0], renderBed.position3D[1], renderBed.position3D[2]);
      group.userData = { bedId: renderBed.id };

      // 1. Bed Base & Ergonomic Frame
      const frameGeo = new THREE.BoxGeometry(1.4, 0.25, 2.2);
      const frameMesh = new THREE.Mesh(frameGeo, materials.frame);
      frameMesh.position.y = 0.125;
      frameMesh.castShadow = true;
      group.add(frameMesh);

      // 2. Mattress
      const mattressGeo = new THREE.BoxGeometry(1.3, 0.25, 2.1);
      const mattressMesh = new THREE.Mesh(mattressGeo, materials.mattress);
      mattressMesh.position.y = 0.35;
      group.add(mattressMesh);

      // 3. Blanket (Purpose-Driven Status Colors)
      const blanketMat =
        renderBed.status === 'available'
          ? materials.available
          : renderBed.status === 'ghost'
          ? materials.ghost
          : renderBed.status === 'cleaning'
          ? materials.cleaning
          : renderBed.status === 'reserved'
          ? materials.reserved
          : materials.occupied;

      const blanketGeo = new THREE.BoxGeometry(1.32, 0.16, 1.4);
      const blanketMesh = new THREE.Mesh(blanketGeo, blanketMat);
      blanketMesh.position.set(0, 0.45, 0.3);
      group.add(blanketMesh);

      if (renderBed.status === 'occupied') {
        breathingBlanketsRef.current.push(blanketMesh);
      }

      // 4. Pillow
      const pillowGeo = new THREE.BoxGeometry(0.9, 0.12, 0.45);
      const pillowMesh = new THREE.Mesh(pillowGeo, materials.pillow);
      pillowMesh.position.set(0, 0.45, -0.7);
      group.add(pillowMesh);

      // 5. Headboard
      const headboardGeo = new THREE.BoxGeometry(1.4, 0.8, 0.1);
      const headboardMesh = new THREE.Mesh(headboardGeo, materials.frame);
      headboardMesh.position.set(0, 0.5, -1.05);
      group.add(headboardMesh);

      // 6. Medical Telemetry Monitor Stand & Live ECG Monitor
      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4);
      const poleMesh = new THREE.Mesh(poleGeo, materials.frame);
      poleMesh.position.set(0.8, 0.7, -0.9);
      group.add(poleMesh);

      const monitorGeo = new THREE.BoxGeometry(0.42, 0.3, 0.08);
      const monitorBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const monitorMesh = new THREE.Mesh(monitorGeo, monitorBaseMat);
      monitorMesh.position.set(0.8, 1.3, -0.9);
      monitorMesh.rotation.y = -Math.PI / 6;
      group.add(monitorMesh);

      // Active Live ECG Trace on Monitor Screen for Occupied Beds
      if (renderBed.status === 'occupied') {
        const ecgCanvas = document.createElement('canvas');
        ecgCanvas.width = 128;
        ecgCanvas.height = 64;
        const ecgCtx = ecgCanvas.getContext('2d');
        if (ecgCtx) {
          const ecgTexture = new THREE.CanvasTexture(ecgCanvas);
          const screenGeo = new THREE.PlaneGeometry(0.38, 0.24);
          const screenMat = new THREE.MeshBasicMaterial({ map: ecgTexture });
          const screenMesh = new THREE.Mesh(screenGeo, screenMat);
          screenMesh.position.set(0.8, 1.3, -0.85);
          screenMesh.rotation.y = -Math.PI / 6;
          group.add(screenMesh);
          ecgCanvasesRef.current.push({ ctx: ecgCtx, texture: ecgTexture, offset: 0 });
        }
      }

      // 7. Tailored Dynamic Animated Effects per Bed Status

      // A. Ghost Bed: Pulsing Hazard Gold Shockwaves + Rotating 3D Diamond
      if (renderBed.status === 'ghost') {
        for (let r = 0; r < 3; r++) {
          const ringGeo = new THREE.RingGeometry(0.8, 1.05, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = -Math.PI / 2;
          ringMesh.position.y = 0.04;
          group.add(ringMesh);

          ghostHalosRef.current.push({
            mesh: ringMesh,
            scale: 0.6 + r * 0.7,
            speed: 0.022,
            maxScale: 2.6
          });
        }

        // Floating Rotating 3D Hazard Diamond
        const diamondGeo = new THREE.OctahedronGeometry(0.28, 0);
        const diamondMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.2,
          roughness: 0.1
        });
        const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
        diamondMesh.position.set(0, 1.6, 0);
        group.add(diamondMesh);
        ghostDiamondsRef.current.push(diamondMesh);
      }

      // B. Cleaning Bed: Robotic UV-C Cyan Laser Scanner Sweep
      else if (renderBed.status === 'cleaning') {
        // Physical UV Laser Bar
        const barGeo = new THREE.BoxGeometry(1.34, 0.06, 0.14);
        const barMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending
        });
        const barMesh = new THREE.Mesh(barGeo, barMat);
        barMesh.position.set(0, 0.54, 0);
        group.add(barMesh);

        // Downward UV-C Light Cone
        const coneGeo = new THREE.ConeGeometry(0.7, 0.8, 16);
        coneGeo.translate(0, -0.4, 0);
        const coneMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        const coneMesh = new THREE.Mesh(coneGeo, coneMat);
        coneMesh.position.set(0, 0.9, 0);
        group.add(coneMesh);

        uvSweepsRef.current.push({ bar: barMesh, cone: coneMesh, baseZ: 0 });

        // Floor Disinfection Ring
        const ringGeo = new THREE.RingGeometry(0.85, 1.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.y = 0.04;
        group.add(ringMesh);
      }

      // C. Available Bed: Breathing Calm Mint Aura
      else if (renderBed.status === 'available') {
        const ringGeo = new THREE.RingGeometry(0.85, 1.15, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.y = 0.04;
        group.add(ringMesh);
        availableAurasRef.current.push(ringMesh);
      }

      // D. Reserved Bed: Neon Purple Reservation Beacon
      else if (renderBed.status === 'reserved') {
        const ringGeo = new THREE.RingGeometry(0.9, 1.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.y = 0.04;
        group.add(ringMesh);
      }

      // Highlight if selected
      if (bed.id === selectedBedId) {
        const selectBoxGeo = new THREE.BoxGeometry(1.6, 1.8, 2.5);
        const selectBoxMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          wireframe: true,
          transparent: true,
          opacity: 0.85
        });
        const selectBox = new THREE.Mesh(selectBoxGeo, selectBoxMat);
        selectBox.position.set(0, 0.9, 0);
        group.add(selectBox);
      }

      scene.add(group);
      bedMeshesRef.current.set(bed.id, group);
    });
  }, [beds, selectedBedId, predictiveOffsetHours]);

  // Apply Bed Capacity Filter in Three.js Scene
  useEffect(() => {
    bedMeshesRef.current.forEach((group, bedId) => {
      const bed = beds.find(b => b.id === bedId);
      if (!bed) return;
      
      // Calculate effective status for filtering as well
      let effectiveStatus = bed.status;
      if (predictiveOffsetHours && predictiveOffsetHours > 0) {
        const seed = bed.id.charCodeAt(bed.id.length - 1) + (bed.id.charCodeAt(bed.id.length - 2) || 0);
        const flipThreshold = predictiveOffsetHours * 2.5; 
        if (seed % 100 < flipThreshold) {
          if (bed.status === 'available' || bed.status === 'cleaning') effectiveStatus = 'occupied';
          else if (bed.status === 'occupied') effectiveStatus = 'available';
        }
      }

      let isMatch = true;
      if (bedFilter === 'available') isMatch = effectiveStatus === 'available';
      else if (bedFilter === 'occupied') isMatch = effectiveStatus === 'occupied';
      else if (bedFilter === 'ghost') isMatch = effectiveStatus === 'ghost';
      else if (bedFilter === 'icu') isMatch = bed.ward === 'ICU';

      group.visible = isMatch;
    });
  }, [bedFilter, beds, predictiveOffsetHours]);

  // Mouse Orbit & Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      targetCameraAngleRef.current.theta -= deltaX * 0.008;
      targetCameraAngleRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, targetCameraAngleRef.current.phi - deltaY * 0.008)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycast Tooltip
    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const bedGroups = Array.from(bedMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(bedGroups, true);

    if (intersects.length > 0) {
      let currentObj: THREE.Object3D | null = intersects[0].object;
      while (currentObj && !currentObj.userData.bedId && currentObj.parent) {
        currentObj = currentObj.parent;
      }

      if (currentObj && currentObj.userData.bedId) {
        const foundBed = beds.find(b => b.id === currentObj?.userData.bedId);
        if (foundBed) {
          const patient = patients.find(p => p.id === foundBed.patientId);
          setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            bed: foundBed,
            patientName: patient?.name,
            diagnosis: patient?.diagnosis,
            acuity: patient?.acuity
          });
          return;
        }
      }
    }

    setTooltip(null);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    targetCameraAngleRef.current.radius = Math.max(12, Math.min(55, targetCameraAngleRef.current.radius + e.deltaY * 0.04));
  };

  const handleClick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const bedGroups = Array.from(bedMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(bedGroups, true);

    if (intersects.length > 0) {
      let currentObj: THREE.Object3D | null = intersects[0].object;
      while (currentObj && !currentObj.userData.bedId && currentObj.parent) {
        currentObj = currentObj.parent;
      }
      if (currentObj && currentObj.userData.bedId) {
        setSelectedBedId(currentObj.userData.bedId);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(
      new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1),
      cameraRef.current
    );

    const intersects = raycaster.intersectObjects(Array.from(bedMeshesRef.current.values()), true);
    if (intersects.length > 0) {
      let currentObj: THREE.Object3D | null = intersects[0].object;
      while (currentObj && !currentObj.userData.bedId && currentObj.parent) currentObj = currentObj.parent;
      if (currentObj && currentObj.userData.bedId) {
        setContextMenu({ x: e.clientX, y: e.clientY, bedId: currentObj.userData.bedId });
        sound.playTactileClick();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const patientId = e.dataTransfer.getData('application/x-patient-id');
    if (!patientId) return;

    const container = containerRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(
      new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1),
      cameraRef.current
    );

    const intersects = raycaster.intersectObjects(Array.from(bedMeshesRef.current.values()), true);
    if (intersects.length > 0) {
      let currentObj: THREE.Object3D | null = intersects[0].object;
      while (currentObj && !currentObj.userData.bedId && currentObj.parent) currentObj = currentObj.parent;
      if (currentObj && currentObj.userData.bedId) {
        assignPatientToBed(patientId, currentObj.userData.bedId);
      }
    }
  };

  // Camera presets
  const setCameraView = (preset: 'iso' | 'top' | 'icu' | 'ed') => {
    setCameraPreset(preset);
    if (preset === 'iso') {
      targetCameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 34 };
      targetCameraLookAtRef.current.set(0, 0, 0);
    } else if (preset === 'top') {
      targetCameraAngleRef.current = { theta: 0, phi: 0.12, radius: 36 };
      targetCameraLookAtRef.current.set(0, 0, 0);
    } else if (preset === 'icu') {
      targetCameraAngleRef.current = { theta: Math.PI / 6, phi: Math.PI / 3.5, radius: 18 };
      targetCameraLookAtRef.current.set(3.5, 0, -10);
    } else if (preset === 'ed') {
      targetCameraAngleRef.current = { theta: Math.PI / 1.5, phi: Math.PI / 3.5, radius: 18 };
      targetCameraLookAtRef.current.set(-10.5, 0, 0.5);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#060913] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      {/* Top-Right Control Strip: Oxygen, Blood Bank, View Mode */}
      <div className="absolute top-3.5 right-3.5 z-30 flex items-center gap-2 flex-wrap justify-end">
        {onOpenOxygen && (
          <button
            onClick={() => {
              sound.playRadarPing();
              onOpenOxygen();
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-950 via-slate-900 to-teal-950 hover:from-cyan-900 hover:to-teal-900 text-cyan-300 hover:text-cyan-100 border border-cyan-500/50 hover:border-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer group"
            title="Inspect Cryogenic Liquid Medical Oxygen (LMO) Storage Tank"
          >
            <Wind className="w-3.5 h-3.5 text-cyan-400 animate-pulse group-hover:rotate-45" />
            <span>Oxygen Bank</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </button>
        )}

        {onOpenBlood && (
          <button
            onClick={() => {
              sound.playRadarPing();
              onOpenBlood();
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 hover:from-rose-900 hover:to-red-900 text-rose-300 hover:text-rose-100 border border-rose-500/50 hover:border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition-all cursor-pointer group"
            title="Inspect Central Blood Bank & Cryo-Storage Units"
          >
            <Droplet className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            <span>Blood Bank</span>
          </button>
        )}

        {/* View Switcher: 3D Bed Matrix vs Anatomy */}
        <div className="flex items-center bg-slate-900/95 border border-slate-700/80 rounded-xl p-0.5 shadow-xl">
          <button
            onClick={() => {
              sound.playRadarPing();
              setViewMode('bed-matrix');
              setTimeout(() => {
                if (containerRef.current && rendererRef.current && cameraRef.current) {
                  const w = containerRef.current.clientWidth;
                  const h = containerRef.current.clientHeight;
                  if (w > 0 && h > 0) {
                    cameraRef.current.aspect = w / h;
                    cameraRef.current.updateProjectionMatrix();
                    rendererRef.current.setSize(w, h);
                  }
                }
              }, 40);
            }}
            className={`px-2.5 py-1 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'bed-matrix'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🛏️ 3D Bed Matrix</span>
          </button>
          <button
            onClick={() => {
              sound.playTactileClick();
              setViewMode('structure');
            }}
            className={`px-2.5 py-1 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'structure'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏢 Facility Anatomy</span>
          </button>
        </div>
      </div>

      {/* 1. THREE.JS 3D BED MATRIX (PERMANENTLY MOUNTED IN DOM) */}
      <div className={`absolute inset-0 w-full h-full ${viewMode === 'bed-matrix' ? 'block' : 'hidden'}`}>
        {/* 3D Canvas Mount */}
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </div>

      {/* Top-Left: Hospital Status & Big Available Beds Counter */}
      <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-2 max-w-sm sm:max-w-md">
        <div className="bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-cyan-500/40 text-xs shadow-2xl space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🏥</span>
              <div>
                <h3 className="font-extrabold text-slate-100 text-xs tracking-wide">
                  {currentHospital.name}
                </h3>
                <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>3D Ward Sensor Grid Connected</span>
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {currentHospital.traumaLevel}
            </span>
          </div>

          {/* Big Live Available Beds Callout */}
          <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="text-[10px] font-mono text-emerald-300 uppercase font-bold tracking-wider">
                  Available Beds Right Now
                </div>
                <div className="text-xl font-black font-mono text-emerald-300 leading-none">
                  {actualHospitalAvailableBeds} <span className="text-xs font-normal text-slate-400">/ {actualHospitalTotalBeds} Total</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playRadarPing();
                setBedFilter(bedFilter === 'available' ? 'all' : 'available');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
                bedFilter === 'available'
                  ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {bedFilter === 'available' ? '✓ Showing Available' : 'Highlight Available ➔'}
            </button>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1 pt-1 border-t border-slate-800/80 text-[10px] font-mono overflow-x-auto">
            <button
              onClick={() => {
                sound.playTactileClick();
                setBedFilter('all');
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                bedFilter === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({beds.length})
            </button>
            <button
              onClick={() => {
                sound.playTactileClick();
                setBedFilter('available');
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                bedFilter === 'available' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:bg-slate-800'
              }`}
            >
              Available ({beds.filter(b => b.status === 'available').length})
            </button>
            <button
              onClick={() => {
                sound.playTactileClick();
                setBedFilter('icu');
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                bedFilter === 'icu' ? 'bg-purple-500 text-white font-bold' : 'text-purple-400 hover:bg-slate-800'
              }`}
            >
              ICU ({beds.filter(b => b.ward === 'ICU').length})
            </button>
            <button
              onClick={() => {
                sound.playTactileClick();
                setBedFilter('occupied');
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                bedFilter === 'occupied' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-sky-400 hover:bg-slate-800'
              }`}
            >
              Occupied ({beds.filter(b => b.status === 'occupied').length})
            </button>
            {beds.some(b => b.status === 'ghost') && (
              <button
                onClick={() => {
                  sound.playTactileClick();
                  setBedFilter('ghost');
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  bedFilter === 'ghost' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 hover:bg-slate-800'
                }`}
              >
                Ghost ({beds.filter(b => b.status === 'ghost').length})
              </button>
            )}
          </div>
        </div>

        {/* Camera Views Ribbon */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 shadow-xl w-fit">
          <span className="text-cyan-400 font-semibold flex items-center gap-1 pr-1.5 border-r border-slate-700">
            <Eye className="w-3 h-3" /> Camera:
          </span>
          <button
            onClick={() => setCameraView('iso')}
            className={`px-2 py-0.5 rounded transition-colors ${
              cameraPreset === 'iso' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            Isometric
          </button>
          <button
            onClick={() => setCameraView('top')}
            className={`px-2 py-0.5 rounded transition-colors ${
              cameraPreset === 'top' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            Top-Down
          </button>
          <button
            onClick={() => setCameraView('icu')}
            className={`px-2 py-0.5 rounded transition-colors ${
              cameraPreset === 'icu' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            ICU
          </button>
          <button
            onClick={() => setCameraView('ed')}
            className={`px-2 py-0.5 rounded transition-colors ${
              cameraPreset === 'ed' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            ED
          </button>
          <button
            onClick={() => setCameraView('iso')}
            title="Reset Camera"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 ml-1"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Interaction Hint (Bottom-Left) */}
      <div className="absolute bottom-3 left-4 z-10 text-[11px] text-slate-400 flex items-center gap-4 bg-slate-900/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" /> Left-click + drag to rotate • Scroll to zoom • Click any bed to inspect vitals
        </span>
      </div>

      {/* Hover Tooltip HUD */}
      {contextMenu && (
        <BedContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          bedId={contextMenu.bedId}
          onClose={() => setContextMenu(null)}
        />
      )}

      {tooltip && !contextMenu && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 bg-slate-900/95 border border-cyan-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs w-60 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-slate-100 text-sm">Bed {tooltip.bed.id}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold capitalize ${
                tooltip.bed.status === 'available'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : tooltip.bed.status === 'occupied'
                  ? 'bg-sky-500/20 text-sky-300'
                  : tooltip.bed.status === 'ghost'
                  ? 'bg-amber-500/20 text-amber-300'
                  : tooltip.bed.status === 'cleaning'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              {tooltip.bed.status}
            </span>
          </div>

          <div className="space-y-1 text-slate-300 text-[11px]">
            <div>Ward: <span className="text-slate-100 font-semibold">{tooltip.bed.ward}</span></div>
            {tooltip.patientName && (
              <div>Patient: <span className="text-cyan-300 font-semibold">{tooltip.patientName}</span></div>
            )}
            {tooltip.diagnosis && (
              <div>Dx: <span className="text-slate-200">{tooltip.diagnosis}</span></div>
            )}
            {tooltip.acuity && (
              <div>Acuity: <span className="font-bold text-rose-400 font-mono">Score {tooltip.acuity}</span></div>
            )}
          </div>
        </div>
      )}

      {/* 2. FACILITY ANATOMY MULTI-FLOOR VIEW (PERMANENTLY MOUNTED IN DOM) */}
      <div className={`absolute inset-0 w-full h-full overflow-hidden ${viewMode === 'structure' ? 'block' : 'hidden'}`}>
        <HospitalFacilityStructure
          onOpenComms={onOpenComms}
          onOpenOxygen={onOpenOxygen}
          onOpenBlood={onOpenBlood}
        />
      </div>

      {/* ER Waiting Queue Overlay (Draggable Triage) */}
      <div className="absolute top-16 left-3.5 z-20 w-72 h-[calc(100%-80px)] pointer-events-none">
        <div className="h-full pointer-events-auto shadow-xl">
          <ERWaitingQueue />
        </div>
      </div>
    </div>
  );
};
