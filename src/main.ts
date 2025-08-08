import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; // (optional fallback; we roll simple orbit)
import { createMountainTerrain } from "./terrain";
import { createCastle } from "./castle";
import { InputManager } from "./input";
import { Character } from "./character";

// Renderer & scene
const container = document.getElementById("app") as HTMLDivElement;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202533);
scene.fog = new THREE.Fog(0x202533, 120, 420);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Lights
const hemi = new THREE.HemisphereLight(0xbcd7ff, 0x223311, 0.6);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(-60, 120, 40);
dir.castShadow = true;
const s = 120;
Object.assign(dir.shadow.camera, { left: -s, right: s, top: s, bottom: -s });
dir.shadow.mapSize.set(2048, 2048);
scene.add(dir);

// Terrain
const {
  mesh: terrain,
  getHeightAt,
  size: terrainSize,
} = createMountainTerrain({ size: 420, segments: 220, peakHeight: 34 });
terrain.receiveShadow = true;
scene.add(terrain);

// Castle at the top (near 0,0)
const topY = getHeightAt(0, 0);
const { group: castle, colliders, gateWorldPos } = createCastle(topY);
scene.add(castle);

// Convert 3D Box3 to 2D XZ rectangles for cheap collisions
const collidersXZ = colliders.map((b) => ({
  min: new THREE.Vector3(b.min.x, 0, b.min.z),
  max: new THREE.Vector3(b.max.x, 0, b.max.z),
}));

// Character
const hero = new Character();
hero.setPosition(0, topY + 2, gateWorldPos.z + 20); // spawn facing the gate
scene.add(hero.group);

// Camera boom (third person)
let camYaw = Math.PI; // look towards -Z by default
let camPitch = 0.25;
const boomOffset = new THREE.Vector3(0, 6, 10);

const input = new InputManager(renderer.domElement);
input.onOrbit = (dx) => {
  camYaw -= dx * 0.005;
};

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Click to slash
renderer.domElement.addEventListener("mousedown", (e) => {
  if (e.button === 0) hero.slash();
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());

  // Movement relative to camera yaw
  const dir = input.getDirectionXZ(camYaw);
  hero.update(dt, dir, getHeightAt, collidersXZ);

  // Third-person camera follow
  const target = hero.group.position.clone();
  const yaw = hero.getYaw();

  const cy = camYaw;
  const offset = new THREE.Vector3(
    Math.sin(cy) * boomOffset.z,
    boomOffset.y,
    Math.cos(cy) * boomOffset.z
  );
  const desired = target.clone().add(offset);

  camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
  camera.lookAt(target.x, target.y + 1.2, target.z);

  renderer.render(scene, camera);
}

// Simple ground helpers
const grid = new THREE.GridHelper(800, 80, 0x334455, 0x223344);
(grid.material as THREE.Material).opacity = 0.2;
(grid.material as THREE.Material).transparent = true;
scene.add(grid);

animate();
