'use client';

import { useEffect, useRef } from 'react';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';

// A single, restrained WebGL accent for the hero: a slowly turning faceted
// wireframe with points at its vertices, in the brand gold. It is intentionally
// quiet — low opacity, gentle motion — so it reads as craft, not decoration.
// Loaded only on capable, larger screens, and never when reduced motion is set.
export default function HeroAccent() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (width === 0 || height === 0) return;

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const gold = 0xc9a045;
    const group = new Group();

    // Faceted base form, rendered only as its edges.
    const base = new IcosahedronGeometry(1.7, 1);
    const edges = new WireframeGeometry(base);
    const lines = new LineSegments(
      edges,
      new LineBasicMaterial({ color: gold, transparent: true, opacity: 0.5 }),
    );
    group.add(lines);

    // A point at each unique vertex for a little more presence.
    const pointsGeo = new BufferGeometry();
    pointsGeo.setAttribute('position', new Float32BufferAttribute(base.attributes.position.array.slice(), 3));
    const points = new Points(
      pointsGeo,
      new PointsMaterial({ color: gold, size: 0.055, transparent: true, opacity: 0.85 }),
    );
    group.add(points);

    scene.add(group);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Gentle pointer parallax, eased toward a target tilt.
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    function onPointer(event: PointerEvent) {
      target.x = (event.clientY / window.innerHeight - 0.5) * 0.4;
      target.y = (event.clientX / window.innerWidth - 0.5) * 0.6;
    }
    if (!reduceMotion) window.addEventListener('pointermove', onPointer, { passive: true });

    let raf = 0;
    let running = true;

    function render() {
      current.x += (target.x - current.x) * 0.04;
      current.y += (target.y - current.y) * 0.04;
      group.rotation.x = current.x + (reduceMotion ? 0.3 : group.rotation.x + 0.0012);
      group.rotation.y = current.y + (reduceMotion ? -0.2 : group.rotation.y + 0.002);
      renderer.render(scene, camera);
    }

    function loop() {
      if (!running) return;
      render();
      raf = requestAnimationFrame(loop);
    }

    function onResize() {
      const el = mountRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    // Pause when the hero scrolls out of view or the tab is hidden.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        if (visible && !document.hidden && !reduceMotion) {
          if (!running) {
            running = true;
            loop();
          }
        } else {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.01 },
    );
    observer.observe(mount);

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        running = true;
        loop();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    if (reduceMotion) {
      render(); // one static frame
    } else {
      loop();
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      lines.geometry.dispose();
      (lines.material as LineBasicMaterial).dispose();
      points.geometry.dispose();
      (points.material as PointsMaterial).dispose();
      base.dispose();
      edges.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="hero-accent__canvas" aria-hidden="true" />;
}
