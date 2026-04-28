import { useEffect, useRef } from "react";
import * as THREE from "three";
import logoHeroWhite from "@/assets/beitak-logo-hero-white.png";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * BeitakLogo3D
 *
 * The Beitak hero logo, rendered as a real 3D Three.js object. The logo PNG
 * is mapped onto the front face of a BoxGeometry with physical thickness;
 * the sides + back use a dark-red material so the depth is visible as the
 * box rotates.
 */
export function BeitakLogo3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    // Scene
    const scene = new THREE.Scene();

    // Camera — sized so a 3-unit-wide box fits the container.
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xe63030, 1.5);
    dirLight.position.set(4, 4, 3);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.6, 20);
    pointLight.position.set(0, -3, 2);
    scene.add(pointLight);

    // Logo box — 3 × 1.5 × 0.15 with PNG on the front, dark red sides + back.
    const group = new THREE.Group();
    scene.add(group);

    const loader = new THREE.TextureLoader();
    loader.load(logoHeroWhite, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;

      const frontMat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.05,
        roughness: 0.45,
        metalness: 0.2,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        roughness: 0.5,
        metalness: 0.25,
      });

      const geo = new THREE.BoxGeometry(3, 1.5, 0.15);
      // Material order: +X, -X, +Y, -Y, +Z (front), -Z (back)
      const mesh = new THREE.Mesh(geo, [
        sideMat, sideMat, sideMat, sideMat, frontMat, sideMat,
      ]);
      group.add(mesh);
    });

    // Mouse tilt (desktop only) — follows cursor up to ±15°.
    const target = { x: 0, y: 0 };
    const maxTilt = (15 * Math.PI) / 180;
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalize over the viewport for a wide tracking range.
      const nx = (e.clientX - cx) / (window.innerWidth / 2);
      const ny = (e.clientY - cy) / (window.innerHeight / 2);
      target.x = THREE.MathUtils.clamp(-ny, -1, 1) * maxTilt;
      target.y = THREE.MathUtils.clamp(nx, -1, 1) * maxTilt;
    };
    if (!isMobile) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    // Animation loop
    const clock = new THREE.Clock();
    let acc = 0;
    const minDelta = isMobile ? 1 / 30 : 0;
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      acc += delta;
      if (acc < minDelta) return;
      const dt = acc;
      acc = 0;
      const t = clock.elapsedTime;

      // Continuous Y rotation: 360° / 10s
      group.rotation.y += dt * ((Math.PI * 2) / 10);

      // Float ±0.15 over 3s
      group.position.y = Math.sin((t * Math.PI * 2) / 3) * 0.15;

      if (isMobile) {
        // Gentle automatic left/right sway in addition to Y spin.
        group.rotation.z = Math.sin(t * 0.8) * (8 * Math.PI / 180);
        group.rotation.x = Math.sin(t * 0.6) * (5 * Math.PI / 180);
      } else {
        // Smooth ease toward cursor target on X tilt + Z roll.
        group.rotation.x += (target.x - group.rotation.x) * 0.08;
        group.rotation.z += (target.y * 0.4 - group.rotation.z) * 0.08;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      if (!isMobile) window.removeEventListener("pointermove", onPointerMove);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            const mm = m as THREE.MeshStandardMaterial;
            mm.map?.dispose();
            mm.dispose();
          });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      aria-label="Beitak"
      className="h-full w-full"
    />
  );
}
