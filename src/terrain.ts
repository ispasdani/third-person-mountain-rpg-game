import * as THREE from "three";
import { fbm2D, lerp } from "./utils";

export type HeightSampler = (x: number, z: number) => number;

export function createMountainTerrain({
  size = 400,
  segments = 200,
  peakHeight = 28,
}: { size?: number; segments?: number; peakHeight?: number } = {}) {
  const geom = new THREE.PlaneGeometry(size, size, segments, segments);
  geom.rotateX(-Math.PI / 2);

  // Precompute heights for each vertex (grid) using a radial mountain + fBM noise
  const heights = new Float32Array((segments + 1) * (segments + 1));
  const toIdx = (ix: number, iz: number) => iz * (segments + 1) + ix;

  for (let iz = 0; iz <= segments; iz++) {
    for (let ix = 0; ix <= segments; ix++) {
      const x = (ix / segments - 0.5) * size;
      const z = (iz / segments - 0.5) * size;
      const r = Math.hypot(x, z) / (size * 0.5);
      const mountain = Math.max(0, Math.pow(1 - r, 3)) * peakHeight;
      const n = fbm2D(x * 0.02, z * 0.02, 5, 2, 0.5) * 10 - 2;
      const h = mountain + n;
      heights[toIdx(ix, iz)] = h;
    }
  }

  // Apply to geometry
  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, heights[i]);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x667755,
    roughness: 1,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;

  // Bilinear sample the grid to get height at world (x,z)
  const half = size / 2;
  const getHeightAt: HeightSampler = (x, z) => {
    const u = (x + half) / size;
    const v = (z + half) / size;
    const gx = Math.max(0, Math.min(segments - 1, Math.floor(u * segments)));
    const gz = Math.max(0, Math.min(segments - 1, Math.floor(v * segments)));
    const fu = u * segments - gx;
    const fv = v * segments - gz;

    const h00 = heights[toIdx(gx, gz)];
    const h10 = heights[toIdx(gx + 1, gz)];
    const h01 = heights[toIdx(gx, gz + 1)];
    const h11 = heights[toIdx(gx + 1, gz + 1)];
    return lerp(lerp(h00, h10, fu), lerp(h01, h11, fu), fv);
  };

  return { mesh, getHeightAt, size };
}
