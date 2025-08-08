export class InputManager {
  keys = new Set<string>();
  mouseDown = false;
  orbiting = false;
  lastX = 0;

  constructor(el: HTMLElement) {
    window.addEventListener("keydown", (e) =>
      this.keys.add(e.key.toLowerCase())
    );
    window.addEventListener("keyup", (e) =>
      this.keys.delete(e.key.toLowerCase())
    );

    el.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.mouseDown = true;
      this.orbiting = true;
      this.lastX = e.clientX;
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouseDown = false;
      this.orbiting = false;
    });
    el.addEventListener("mousemove", (e) => {
      if (this.orbiting) {
        const dx = e.clientX - this.lastX;
        this.lastX = e.clientX;
        this.onOrbit?.(dx);
      }
    });
  }

  onOrbit?: (dx: number) => void;

  getDirectionXZ(yawRad: number) {
    // movement relative to camera yaw
    const forward = +this.keys.has("w") - +this.keys.has("s");
    const right = +this.keys.has("d") - +this.keys.has("a");
    if (forward === 0 && right === 0) return { x: 0, z: 0 };
    const len = Math.hypot(right, forward) || 1;
    const f = forward / len;
    const r = right / len;
    const sin = Math.sin(yawRad),
      cos = Math.cos(yawRad);
    // rotate by yaw
    const x = r * cos + f * sin;
    const z = f * cos - r * sin;
    return { x, z };
  }
}
