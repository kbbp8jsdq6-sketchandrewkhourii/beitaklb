import { useEffect, useRef } from "react";
import * as THREE from "three";
import logoHeroWhite from "@/assets/beitak-logo-hero-white.png";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * BeitakLogo3D
 *
 * A real Three.js 3D rendering of the Beitak logo, sitting BEHIND the
 * existing HTML logo image in the hero. Adds a 3D card with thickness,
 * cinematic lighting, auto Y rotation, float, and mouse-tilt (desktop)
 * or auto sway (mobile).
 *
 * The canvas is absolutely positioned and pointer-events: none so it
 * never interferes with the rest of the hero UI.
 */
export function BeitakLogo3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xe63030, 1.2);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 20);
    pointLight.position.set(0, -3, 2);
    scene.add(pointLight);

    // Logo card group (BoxGeometry for real thickness, with logo texture
    // on the front face and a darker red on sides/back).
    const group = new THREE.Group();
    scene.add(group);

    const cardWidth = 3.2;
    const cardHeight = 2.0;
    const cardDepth = 0.05;

    const loader = new THREE.TextureLoader();
    loader.load(logoHeroWhite, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;

      const frontMat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.05,
        roughness: 0.45,
        metalness: 0.15,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        color: 0x8a1a1a,
        roughness: 0.5,
        metalness: 0.2,
      });
      const backMat = new THREE.MeshStandardMaterial({
        color: 0x5a0e0e,
        roughness: 0.6,
        metalness: 0.15,
      });

      const geo = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
      // Box face material order: +X, -X, +Y, -Y, +Z (front), -Z (back)
      const mesh = new THREE.Mesh(geo, [
        sideMat, sideMat, sideMat, sideMat, frontMat, backMat,
      ]);
      group.add(mesh);
    });

    // Mouse tracking (desktop) — tilt toward cursor up to ±15°.
    const target = { x: 0, y: 0 };
    const maxTilt = (15 * Math.PI) / 180;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      target.x = -ny * maxTilt; // tilt X based on vertical mouse pos
      target.y = nx * maxTilt;
    };

    if (!isMobile) {
      // Listen on window so the logo reacts anywhere in the hero area.
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    // Animation
    const clock = new THREE.Clock();
    let last = 0;
    // 30fps cap on mobile, uncapped on desktop
    const minDelta = isMobile ? 1 / 30 : 0;
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      last += delta;
      if (last < minDelta) return;
      const dt = last;
      last = 0;
      const t = clock.elapsedTime;

      // Auto Y rotation: 360° / 8s
      group.rotation.y += dt * ((Math.PI * 2) / 8);

      // Float ±0.3 over 3s
      group.position.y = Math.sin((t * Math.PI * 2) / 3) * 0.3;

      // Mouse tilt (desktop) or auto sway (mobile)
      if (isMobile) {
        const sway = Math.sin(t * 0.8) * (10 * Math.PI / 180);
        group.rotation.z = sway * 0.3;
        // Note: don't override Y rotation; just gentle X tilt
        group.rotation.x = Math.sin(t * 0.6) * (5 * Math.PI / 180);
      } else {
        group.rotation.x += (target.x - group.rotation.x) * 0.08;
        // Layer mouse tilt as a subtle Z offset on top of Y spin
        group.rotation.z += (target.y * 0.3 - group.rotation.z) * 0.08;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      if (!isMobile) window.removeEventListener("pointermove", onPointerMove);
      // Dispose
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
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
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{ willChange: "transform" }}
    />
  );
}
