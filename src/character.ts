import * as THREE from "three";

export class Character {
  public group: THREE.Group;
  private body: THREE.Mesh;
  private rightHand: THREE.Object3D;
  private sword: THREE.Group;
  private yaw = 0;
  private speed = 9;
  private radius = 0.8;
  private height = 2.2;
  private slashT = 1; // 0..1 (1=idle)

  constructor() {
    this.group = new THREE.Group();

    // Body (capsule-ish)
    const bodyGeo = new THREE.CapsuleGeometry(
      this.radius,
      this.height - this.radius * 2,
      4,
      8
    );
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      roughness: 0.9,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.group.add(this.body);

    // Right hand anchor
    this.rightHand = new THREE.Object3D();
    this.rightHand.position.set(0.5, this.height * 0.35, 0.4);
    this.group.add(this.rightHand);

    // Sword (simple blade + hilt)
    const sword = new THREE.Group();
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.1, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.5,
        roughness: 0.2,
      })
    );
    blade.position.y = 0.55;
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.05, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    grip.position.y = -0.2;
    sword.add(blade, guard, grip);
    sword.position.set(0, 0, 0);
    sword.rotation.z = -Math.PI / 2;
    this.rightHand.add(sword);
    this.sword = sword;
  }

  setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
  }

  getYaw() {
    return this.yaw;
  }
  setYaw(rad: number) {
    this.yaw = rad;
  }

  slash() {
    if (this.slashT >= 1) this.slashT = 0; // start new slash
  }

  update(
    dt: number,
    moveDir: { x: number; z: number },
    getHeightAt: (x: number, z: number) => number,
    collidersXZ: Array<{ min: THREE.Vector3; max: THREE.Vector3 }>
  ) {
    // Move on XZ plane
    const pos = this.group.position;
    const moving = moveDir.x !== 0 || moveDir.z !== 0;
    if (moving) {
      // face movement direction smoothly
      const targetYaw = Math.atan2(moveDir.x, moveDir.z);
      const d =
        ((targetYaw - this.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.yaw += d * Math.min(1, dt * 10);

      pos.x += moveDir.x * this.speed * dt;
      pos.z += moveDir.z * this.speed * dt;
    }

    // Basic collision vs axis-aligned rectangles (XZ), ignoring Y
    for (const b of collidersXZ) {
      const ix = pos.x;
      const iz = pos.z;
      const minX = b.min.x - this.radius;
      const maxX = b.max.x + this.radius;
      const minZ = b.min.z - this.radius;
      const maxZ = b.max.z + this.radius;
      if (ix > minX && ix < maxX && iz > minZ && iz < maxZ) {
        const penX = Math.min(ix - minX, maxX - ix);
        const penZ = Math.min(iz - minZ, maxZ - iz);
        if (penX < penZ) {
          pos.x +=
            ix - (ix < (minX + maxX) / 2 ? minX : maxX) > 0 ? penX : -penX;
        } else {
          pos.z += iz - (minZ + maxZ) / 2 > 0 ? penZ : -penZ;
        }
      }
    }

    // Ground stick to terrain
    const groundY = getHeightAt(pos.x, pos.z);
    pos.y = groundY + this.height * 0.5;

    // Apply yaw to the group
    this.group.rotation.y = this.yaw;

    // Sword slash anim (simple 0.25s swing)
    if (this.slashT < 1) {
      this.slashT += dt * 4; // 0.25s to finish
      const t = Math.min(1, this.slashT);
      const swing = Math.sin(t * Math.PI); // 0..1..0
      this.sword.rotation.y = -0.9 + swing * 1.8;
    } else {
      this.sword.rotation.y = 0;
    }
  }
}
