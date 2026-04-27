import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js";

const root = document.querySelector(".studio-widget");
const meshCanvas = document.querySelector(".mesh-canvas");
const objectCanvas = document.querySelector(".object-canvas");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pointer = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
};

const accent = {
  teal: "#54d6c6",
  gold: "#d9b86f",
  paper: "#f4f5f0",
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setupMesh() {
  const context = meshCanvas.getContext("2d", { alpha: true });
  const snippets = ["play", "learn", "practice", "explore", "communicate", "craft", "humane"];
  let nodes = [];
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    const rect = meshCanvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    meshCanvas.width = Math.floor(width * dpr);
    meshCanvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = clamp(Math.round((width * height) / 18000), 22, 58);
    nodes = Array.from({ length: count }, (_, index) => ({
      x: ((index * 139) % width) + Math.sin(index * 2.1) * 28,
      y: ((index * 211) % height) + Math.cos(index * 1.7) * 24,
      vx: Math.sin(index * 0.8) * 0.12,
      vy: Math.cos(index * 1.1) * 0.12,
      label: snippets[index % snippets.length],
      phase: index * 0.37,
    }));
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    const drift = reducedMotion ? 0 : time * 0.00016;
    const pullX = pointer.x * 22;
    const pullY = pointer.y * 16;

    for (const node of nodes) {
      if (!reducedMotion) {
        node.x += node.vx + Math.sin(time * 0.001 + node.phase) * 0.06;
        node.y += node.vy + Math.cos(time * 0.0012 + node.phase) * 0.06;
      }

      if (node.x < -20) node.x = width + 20;
      if (node.x > width + 20) node.x = -20;
      if (node.y < -20) node.y = height + 20;
      if (node.y > height + 20) node.y = -20;
    }

    context.save();
    context.translate(pullX, pullY);

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 148) {
          const alpha = (1 - distance / 148) * 0.24;
          context.strokeStyle = `rgba(190, 211, 213, ${alpha})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }

    nodes.forEach((node, index) => {
      const pulse = reducedMotion ? 0.42 : 0.36 + Math.sin(drift * 18 + node.phase) * 0.12;
      context.fillStyle = index % 5 === 0 ? `rgba(217, 184, 111, ${pulse})` : `rgba(84, 214, 198, ${pulse})`;
      context.beginPath();
      context.arc(node.x, node.y, index % 7 === 0 ? 2.4 : 1.6, 0, Math.PI * 2);
      context.fill();

      if (index % 6 === 0 && width > 560) {
        context.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
        context.fillStyle = "rgba(244, 245, 240, 0.22)";
        context.fillText(node.label, node.x + 8, node.y - 8);
      }
    });

    context.restore();

    if (!reducedMotion) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
}

function createFacet(radius, depth, color, opacity) {
  const geometry = new THREE.CylinderGeometry(radius, radius * 0.82, depth, 5, 1, false);
  const material = new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.18,
    metalness: 0.06,
    transmission: 0.35,
    thickness: 0.45,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
  });
  return new THREE.Mesh(geometry, material);
}

function setupObject() {
  const renderer = new THREE.WebGLRenderer({
    canvas: objectCanvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.5, 8.4);

  const group = new THREE.Group();
  group.position.set(1.36, 0.12, 0);
  scene.add(group);

  const facets = [
    { mesh: createFacet(0.72, 0.3, accent.teal, 0.46), position: [-0.58, 0.34, 0.1], rotation: [0.82, 0.34, -0.16] },
    { mesh: createFacet(0.58, 0.24, accent.gold, 0.38), position: [0.42, 0.18, -0.12], rotation: [1.1, -0.36, 0.34] },
    { mesh: createFacet(0.46, 0.2, accent.paper, 0.28), position: [0.08, -0.62, 0.28], rotation: [0.72, 0.72, 0.06] },
  ];

  facets.forEach(({ mesh, position, rotation }) => {
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    group.add(mesh);
  });

  const pointMaterial = new THREE.MeshBasicMaterial({ color: accent.teal, transparent: true, opacity: 0.72 });
  const pointGeometry = new THREE.SphereGeometry(0.045, 16, 16);
  const pointPositions = [
    [-1.15, 0.82, 0.18],
    [1.12, 0.54, -0.18],
    [0.86, -0.96, 0.3],
    [-0.78, -0.8, -0.28],
  ];
  pointPositions.forEach((position, index) => {
    const point = new THREE.Mesh(pointGeometry, pointMaterial.clone());
    point.material.opacity = index === 1 ? 0.46 : 0.68;
    point.position.set(...position);
    group.add(point);
  });

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: accent.teal,
    transparent: true,
    opacity: 0.18,
    wireframe: true,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.012, 12, 128), ringMaterial);
  ring.rotation.set(1.26, 0.1, 0.1);
  group.add(ring);

  const secondRing = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.01, 12, 128), ringMaterial.clone());
  secondRing.material.opacity = 0.14;
  secondRing.rotation.set(0.36, 1.08, 0.26);
  group.add(secondRing);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.84, 2),
    new THREE.MeshBasicMaterial({
      color: accent.paper,
      transparent: true,
      opacity: 0.06,
      wireframe: true,
    }),
  );
  shell.rotation.set(0.3, 0.15, 0.1);
  group.add(shell);

  scene.add(new THREE.AmbientLight(0xffffff, 1.6));

  const key = new THREE.DirectionalLight(0xeffffb, 3.3);
  key.position.set(-3, 4, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xd9b86f, 2.6);
  rim.position.set(4, -2, 4);
  scene.add(rim);

  function resize() {
    const rect = objectCanvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const mobile = width < 720;
    group.position.x = mobile ? 1.18 : 1.42;
    group.position.y = mobile ? 0.92 : 0.08;
    group.scale.setScalar(mobile ? 0.64 : 1);
  }

  function animate(time) {
    pointer.x += (pointer.targetX - pointer.x) * 0.065;
    pointer.y += (pointer.targetY - pointer.y) * 0.065;

    if (!reducedMotion) {
      group.rotation.y = time * 0.00035 + pointer.x * 0.22;
      group.rotation.x = Math.sin(time * 0.0005) * 0.07 + pointer.y * 0.12;
      ring.rotation.z = time * 0.00042;
      secondRing.rotation.z = -time * 0.00032;
      shell.rotation.y = -time * 0.00022;
    } else {
      group.rotation.set(0.08, -0.16, 0);
      ring.rotation.z = 0.38;
      secondRing.rotation.z = -0.22;
      shell.rotation.y = -0.18;
    }

    renderer.render(scene, camera);
    if (!reducedMotion) requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(animate);
}

function trackPointer(event) {
  const rect = root.getBoundingClientRect();
  const clientX = event.clientX ?? event.touches?.[0]?.clientX ?? rect.left + rect.width / 2;
  const clientY = event.clientY ?? event.touches?.[0]?.clientY ?? rect.top + rect.height / 2;
  pointer.targetX = clamp((clientX - rect.left) / rect.width - 0.5, -0.5, 0.5) * 2;
  pointer.targetY = clamp((clientY - rect.top) / rect.height - 0.5, -0.5, 0.5) * 2;
}

window.addEventListener("pointermove", trackPointer, { passive: true });
window.addEventListener("touchmove", trackPointer, { passive: true });

function supportsWebGL() {
  const canvas = document.createElement("canvas");
  return Boolean(
    window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
  );
}

try {
  setupMesh();
  if (supportsWebGL()) {
    setupObject();
  } else {
    root.classList.add("webgl-unavailable");
  }
} catch (error) {
  console.error("Interactive scene failed to initialize", error);
  root.classList.add("webgl-unavailable");
}
