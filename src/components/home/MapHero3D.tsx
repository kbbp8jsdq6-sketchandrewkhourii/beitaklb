import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Billboard, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const RED = "#C0392B";
const RED_SOFT = "#FF6B6B";
const RED_RIM = "#FF2222";
const RED_EMISSIVE = "#FF4444";
const DARK = "#1A0A0A";
const DARK_AMBIENT = "#1A0505";

const PIN_POSITIONS: [number, number][] = [
  [-1.8, -0.8],
  [-0.6, 0.7],
  [0.9, -0.9],
  [1.7, 0.5],
  [-1.1, 1.1],
  [0.2, -0.2],
  [-0.3, -1.2],
];

const CARD_PIN_INDICES = [1, 3, 4]; // 3 pins get floating cards

// ---------- Grid lines ----------
function GridLines() {
  const geometry = useMemo(() => {
    const points: number[] = [];
    const w = 5.5;
    const d = 3.8;
    const spacing = 0.4;
    const y = 0.035;
    for (let x = -w / 2; x <= w / 2 + 0.001; x += spacing) {
      points.push(x, y, -d / 2, x, y, d / 2);
    }
    for (let z = -d / 2; z <= d / 2 + 0.001; z += spacing) {
      points.push(-w / 2, y, z, w / 2, y, z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={RED} transparent opacity={0.12} />
    </lineSegments>
  );
}

// ---------- Platform ----------
function Platform() {
  return (
    <group>
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[5.5, 0.06, 3.8]} />
        <meshPhysicalMaterial color={DARK} metalness={0.2} roughness={0.7} />
      </mesh>
      {/* Glowing red border */}
      <mesh position={[0, 0.001, 0]}>
        <boxGeometry args={[5.6, 0.05, 3.9]} />
        <meshStandardMaterial
          color={RED}
          emissive={RED}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
          wireframe
        />
      </mesh>
      <GridLines />
    </group>
  );
}

// ---------- Pin ----------
function Pin({
  position,
}: {
  position: [number, number];
}) {
  return (
    <group position={[position[0], 0.25, position[1]]}>
      {/* Cone (pointing down) */}
      <mesh position={[0, -0.13, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.065, 0.26, 16]} />
        <meshStandardMaterial
          color={RED}
          metalness={0.8}
          roughness={0.15}
          emissive={RED}
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Sphere head */}
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshStandardMaterial
          color={RED}
          metalness={0.8}
          roughness={0.15}
          emissive={RED}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Inner heart-ish dot */}
      <mesh position={[0, 0.04, 0.085]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive={RED_EMISSIVE}
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Glow ring at base */}
      <mesh
        position={[0, -0.24, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.14, 0.012, 12, 36]} />
        <meshStandardMaterial
          color={RED}
          emissive={RED}
          emissiveIntensity={0.9}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Vertical beam */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 1.0, 8]} />
        <meshBasicMaterial color={RED} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// ---------- Floating card ----------
function FloatingCard({
  position,
}: {
  position: [number, number];
}) {
  return (
    <group position={[position[0], 0.85, position[1]]}>
      <Billboard>
        {/* Red glowing border (behind) */}
        <mesh position={[0, 0, -0.005]}>
          <boxGeometry args={[0.92, 0.57, 0.01]} />
          <meshStandardMaterial
            color={RED}
            emissive={RED}
            emissiveIntensity={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Dark card */}
        <mesh>
          <boxGeometry args={[0.85, 0.5, 0.01]} />
          <meshStandardMaterial
            color={DARK}
            transparent
            opacity={0.88}
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

// ---------- Scene ----------
function Scene() {
  return (
    <>
      <fog attach="fog" args={[DARK, 10, 22]} />
      <ambientLight intensity={0.5} color={DARK_AMBIENT} />
      <pointLight color={RED} intensity={3.0} position={[0, 4, 2]} />
      <pointLight color={RED_SOFT} intensity={1.5} position={[-3, 2, -1]} />
      <pointLight color={RED_RIM} intensity={2.0} position={[3, 1, 3]} />
      <rectAreaLight
        color={RED}
        intensity={2.5}
        position={[0, 5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={6}
        height={4}
      />

      <Platform />

      {PIN_POSITIONS.map((pos, i) => (
        <Pin key={i} position={pos} />
      ))}

      {CARD_PIN_INDICES.map((i) => (
        <FloatingCard key={`card-${i}`} position={PIN_POSITIONS[i]} />
      ))}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 3}
      />
    </>
  );
}

// ---------- Loading fallback ----------
function LoadingFallback() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: RED,
          opacity: 1.7,
          boxShadow: `0 0 30px ${RED}`,
        }}
      />
    </div>
  );
}

// ---------- Main component (client-only) ----------
function MapHero3DInner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingFallback />;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 2.8, 6], fov: 48 }}
          style={{ background: "transparent" }}
          dpr={[1, 2]}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}

const MapHero3D = React.memo(MapHero3DInner);
export default MapHero3D;
