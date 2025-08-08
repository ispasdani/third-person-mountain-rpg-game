import * as THREE from "three";

export function createCastle(onTopY = 0) {
  const group = new THREE.Group();

  // Materials
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x9a9a9a,
    roughness: 0.95,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.9,
  });

  // Keep (hollow box made from 4 thin walls + a roof plate); leave a door opening on south wall
  const keepSize = 26;
  const wallThick = 1.2;
  const wallHeight = 14;

  const makeWall = (w: number, h: number, d: number) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, wallMat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  const north = makeWall(keepSize, wallHeight, wallThick);
  north.position.set(0, wallHeight / 2, -keepSize / 2);

  const southLeft = makeWall(keepSize * 0.35, wallHeight, wallThick);
  southLeft.position.set(-keepSize * 0.325, wallHeight / 2, keepSize / 2);
  const southRight = makeWall(keepSize * 0.35, wallHeight, wallThick);
  southRight.position.set(keepSize * 0.325, wallHeight / 2, keepSize / 2);
  // door gap in the middle (~30% width)

  const east = makeWall(wallThick, wallHeight, keepSize);
  east.position.set(keepSize / 2, wallHeight / 2, 0);

  const west = makeWall(wallThick, wallHeight, keepSize);
  west.position.set(-keepSize / 2, wallHeight / 2, 0);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(keepSize, wallThick, keepSize),
    roofMat
  );
  roof.position.set(0, wallHeight + wallThick / 2, 0);
  roof.castShadow = true;

  const keep = new THREE.Group();
  keep.add(north, southLeft, southRight, east, west, roof);
  keep.position.y = onTopY;
  group.add(keep);

  // Outer walls forming a courtyard with a gate opening
  const courtSize = 60;
  const courtHeight = 10;

  const cn = makeWall(courtSize, courtHeight, wallThick);
  cn.position.set(0, courtHeight / 2, -courtSize / 2);

  const csLeft = makeWall(courtSize * 0.35, courtHeight, wallThick);
  csLeft.position.set(-courtSize * 0.325, courtHeight / 2, courtSize / 2);
  const csRight = makeWall(courtSize * 0.35, courtHeight, wallThick);
  csRight.position.set(courtSize * 0.325, courtHeight / 2, courtSize / 2);

  const ce = makeWall(wallThick, courtHeight, courtSize);
  ce.position.set(courtSize / 2, courtHeight / 2, 0);

  const cw = makeWall(wallThick, courtHeight, courtSize);
  cw.position.set(-courtSize / 2, courtHeight / 2, 0);

  const courtyard = new THREE.Group();
  courtyard.add(cn, csLeft, csRight, ce, cw);
  courtyard.position.y = onTopY;
  group.add(courtyard);

  // Bounding boxes for collision (exclude the gate gaps)
  const boxes: THREE.Box3[] = [];
  const addBox = (mesh: THREE.Mesh) => {
    mesh.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(mesh);
    boxes.push(b);
  };
  [
    north,
    southLeft,
    southRight,
    east,
    west,
    roof,
    cn,
    csLeft,
    csRight,
    ce,
    cw,
  ].forEach((m) => addBox(m));

  // A flag to help spawn/aim the gate direction (facing +Z)
  const gateWorldPos = new THREE.Vector3(0, onTopY, courtSize / 2);

  return { group, colliders: boxes, gateWorldPos };
}
