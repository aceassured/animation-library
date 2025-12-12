// src/FluidRainbowCursor/simulation.ts
import {
  getWebGLContext,
  compileShader,
  GLProgram,
  GLMaterial,
  GLContextInfo
} from "./gl-utils";
import {
  BASE_VERTEX_SHADER,
  COPY_SHADER,
  CLEAR_SHADER,
  DISPLAY_SHADER,
  SPLAT_SHADER,
  ADVECTION_SHADER,
  DIVERGENCE_SHADER,
  CURL_SHADER,
  VORTICITY_SHADER,
  PRESSURE_SHADER,
  GRADIENT_SUBTRACT_SHADER
} from "./shaders";
import { createFBO, createDoubleFBO, resizeDoubleFBO, FBO, DoubleFBO } from "./framebuffers";
import { Pointer, ColorRGB } from "./types";
import { generateColor, wrap } from "./colors";
import { updatePointerDownData, updatePointerMoveData, updatePointerUpData, scaleByPixelRatio, correctRadius } from "./pointers";

/**
 * Config shape (mirrors props)
 */
export interface SimulationConfig {
  SIM_RESOLUTION: number;
  DYE_RESOLUTION: number;
  CAPTURE_RESOLUTION: number;
  DENSITY_DISSIPATION: number;
  VELOCITY_DISSIPATION: number;
  PRESSURE: number;
  PRESSURE_ITERATIONS: number;
  CURL: number;
  SPLAT_RADIUS: number;
  SPLAT_FORCE: number;
  SHADING: boolean;
  COLOR_UPDATE_SPEED: number;
  BACK_COLOR: ColorRGB;
  TRANSPARENT: boolean;
  PAUSED?: boolean;
}

/**
 * Default config (same defaults as user provided)
 */
export const defaultConfig = (): SimulationConfig => ({
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1440,
  CAPTURE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 3.5,
  VELOCITY_DISSIPATION: 2,
  PRESSURE: 0.1,
  PRESSURE_ITERATIONS: 20,
  CURL: 3,
  SPLAT_RADIUS: 0.2,
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLOR_UPDATE_SPEED: 10,
  BACK_COLOR: { r: 0.5, g: 0, b: 0 },
  TRANSPARENT: true,
  PAUSED: false
});

/**
 * FluidSimulation class
 * - encapsulates the whole GPU sim
 * - exposes start/stop/destroy
 */
export class FluidSimulation {
  canvas: HTMLCanvasElement;
  config: SimulationConfig;
  pointers: Pointer[];

  ctxInfo: GLContextInfo | null = null;
  gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  ext: any = null;

  // Programs / materials
  copyProgram!: GLProgram;
  clearProgram!: GLProgram;
  splatProgram!: GLProgram;
  advectionProgram!: GLProgram;
  divergenceProgram!: GLProgram;
  curlProgram!: GLProgram;
  vorticityProgram!: GLProgram;
  pressureProgram!: GLProgram;
  gradientSubtractProgram!: GLProgram;
  displayMaterial!: GLMaterial;

  // FBOs
  dye!: DoubleFBO;
  velocity!: DoubleFBO;
  divergence!: FBO;
  curl!: FBO;
  pressure!: DoubleFBO;

  // blit helper
  blit!: (target: FBO | null, doClear?: boolean) => void;

  // state
  lastUpdateTime: number = Date.now();
  colorUpdateTimer = 0;
  running = false;
  rafId: number | null = null;

  // For resize/canvas management
  buffer = 0;

  constructor(canvas: HTMLCanvasElement, config?: Partial<SimulationConfig>) {
    this.canvas = canvas;
    this.config = { ...defaultConfig(), ...(config || {}) };
    this.pointers = [];

    // default one pointer to match original
    this.pointers.push({
      id: -1,
      texcoordX: 0,
      texcoordY: 0,
      prevTexcoordX: 0,
      prevTexcoordY: 0,
      deltaX: 0,
      deltaY: 0,
      down: false,
      moved: false,
      color: generateColor()
    });

    // init
    const ctx = getWebGLContext(canvas);
    if (!ctx) {
      throw new Error("Unable to initialize WebGL context in FluidSimulation.");
    }
    this.ctxInfo = ctx;
    this.gl = ctx.gl;
    this.ext = ctx.ext;

    // adjust for no linear filtering support (like original)
    if (!this.ext.supportLinearFiltering) {
      this.config.DYE_RESOLUTION = 256;
      this.config.SHADING = false;
    }

    this.init();
  }

  initProgramsAndBlit() {
    if (!this.gl) return;
    const gl = this.gl;

    // compile base vertex shader once
    const baseVertexShader = compileShader(gl, gl.VERTEX_SHADER, BASE_VERTEX_SHADER);

    // helper compile fragment shaders
    const copyShader = compileShader(gl, gl.FRAGMENT_SHADER, COPY_SHADER);
    const clearShader = compileShader(gl, gl.FRAGMENT_SHADER, CLEAR_SHADER);
    const splatShader = compileShader(gl, gl.FRAGMENT_SHADER, SPLAT_SHADER);
    const advectionShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      ADVECTION_SHADER,
      this.ext.supportLinearFiltering ? null : ["MANUAL_FILTERING"]
    );
    const divergenceShader = compileShader(gl, gl.FRAGMENT_SHADER, DIVERGENCE_SHADER);
    const curlShader = compileShader(gl, gl.FRAGMENT_SHADER, CURL_SHADER);
    const vorticityShader = compileShader(gl, gl.FRAGMENT_SHADER, VORTICITY_SHADER);
    const pressureShader = compileShader(gl, gl.FRAGMENT_SHADER, PRESSURE_SHADER);
    const gradientShader = compileShader(gl, gl.FRAGMENT_SHADER, GRADIENT_SUBTRACT_SHADER);
    // display is used via Material because it has keywords
    // we will pass the source to GLMaterial (it compiles per-keywords)
    // create GLProgram wrappers
    this.copyProgram = new GLProgram(gl, baseVertexShader, copyShader);
    this.clearProgram = new GLProgram(gl, baseVertexShader, clearShader);
    this.splatProgram = new GLProgram(gl, baseVertexShader, splatShader);
    this.advectionProgram = new GLProgram(gl, baseVertexShader, advectionShader);
    this.divergenceProgram = new GLProgram(gl, baseVertexShader, divergenceShader);
    this.curlProgram = new GLProgram(gl, baseVertexShader, curlShader);
    this.vorticityProgram = new GLProgram(gl, baseVertexShader, vorticityShader);
    this.pressureProgram = new GLProgram(gl, baseVertexShader, pressureShader);
    this.gradientSubtractProgram = new GLProgram(gl, baseVertexShader, gradientShader);
    this.displayMaterial = new GLMaterial(gl, baseVertexShader, DISPLAY_SHADER);

    // create blit (vertex buffer + drawElements)
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    const elemBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

    // attribute location 0 used in shaders
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    this.blit = (target: FBO | null, doClear = false) => {
      if (!this.gl) return;
      if (!target) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (doClear) {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  }

  initFramebuffers() {
    if (!this.gl || !this.ctxInfo) return;
    const gl = this.gl;
    const ext = this.ext;

    const simRes = this.getResolution(this.config.SIM_RESOLUTION);
    const dyeRes = this.getResolution(this.config.DYE_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    gl.disable(gl.BLEND);

    if (!this.dye) {
      this.dye = createDoubleFBO(gl, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
    } else {
      this.dye = resizeDoubleFBO(gl, this.dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering, this.copyProgram, this.blit);
    }

    if (!this.velocity) {
      this.velocity = createDoubleFBO(gl, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
    } else {
      this.velocity = resizeDoubleFBO(gl, this.velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering, this.copyProgram, this.blit);
    }

    this.divergence = createFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    this.curl = createFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    this.pressure = createDoubleFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
  }

  init() {
    if (!this.gl) return;
    this.initProgramsAndBlit();
    this.initFramebuffers();
    this.updateKeywords();
    this.resizeCanvas(); // initial resize
    this.lastUpdateTime = Date.now();
    this.colorUpdateTimer = 0;
    this.start();
  }

  updateKeywords() {
    const displayKeywords: string[] = [];
    if (this.config.SHADING) displayKeywords.push("SHADING");
    this.displayMaterial.setKeywords(displayKeywords);
  }

  // --- Canvas & resolution helpers (same as original) ---
  getResolution(resolution: number) {
    if (!this.gl) throw new Error("GL not initialized");
    const w = (this.gl as WebGLRenderingContext).drawingBufferWidth;
    const h = (this.gl as WebGLRenderingContext).drawingBufferHeight;
    const aspectRatio = w / h;
    let aspect = aspectRatio < 1 ? 1 / aspectRatio : aspectRatio;
    const min = Math.round(resolution);
    const max = Math.round(resolution * aspect);
    if (w > h) {
      return { width: max, height: min };
    }
    return { width: min, height: max };
  }

  scaleByPixelRatio(input: number) {
    const pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
  }

  resizeCanvas() {
    const canvas = this.canvas;
    const width = this.scaleByPixelRatio(canvas.clientWidth);
    const height = this.scaleByPixelRatio(canvas.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

  // --- Main loop / step functions ---
  start() {
    if (this.running) return;
    this.running = true;
    this.rafId = requestAnimationFrame(() => this.updateFrame());
  }

  stop() {
    this.running = false;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  updateFrame() {
    if (!this.running) return;
    const dt = this.calcDeltaTime();
    if (this.resizeCanvas()) {
      this.initFramebuffers();
    }
    this.updateColors(dt);
    this.applyInputs();
    this.step(dt);
    this.render(null);
    this.rafId = requestAnimationFrame(() => this.updateFrame());
  }

  calcDeltaTime() {
    const now = Date.now();
    let dt = (now - this.lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666); // cap as original
    this.lastUpdateTime = now;
    return dt;
  }

  updateColors(dt: number) {
    this.colorUpdateTimer += dt * this.config.COLOR_UPDATE_SPEED;
    if (this.colorUpdateTimer >= 1) {
      this.colorUpdateTimer = wrap(this.colorUpdateTimer, 0, 1);
      for (const p of this.pointers) {
        p.color = generateColor();
      }
    }
  }

  applyInputs() {
    for (const p of this.pointers) {
      if (p.moved) {
        p.moved = false;
        this.splatPointer(p);
      }
    }
  }

  // --- step: the simulation tick (copied behavior) ---
  step(dt: number) {
    if (!this.gl) return;
    const gl = this.gl;

    gl.disable(gl.BLEND);

    // curl
    this.curlProgram.bind();
    if (this.curlProgram.uniforms.texelSize) {
      gl.uniform2f(this.curlProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    }
    if (this.curlProgram.uniforms.uVelocity) {
      gl.uniform1i(this.curlProgram.uniforms.uVelocity, this.velocity.read.attach(0));
    }
    this.blit(this.curl);

    // vorticity / vorticity force
    this.vorticityProgram.bind();
    if (this.vorticityProgram.uniforms.texelSize) {
      gl.uniform2f(this.vorticityProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    }
    if (this.vorticityProgram.uniforms.uVelocity) {
      gl.uniform1i(this.vorticityProgram.uniforms.uVelocity, this.velocity.read.attach(0));
    }
    if (this.vorticityProgram.uniforms.uCurl) {
      gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.curl.attach(1));
    }
    if (this.vorticityProgram.uniforms.curl) {
      gl.uniform1f(this.vorticityProgram.uniforms.curl, this.config.CURL);
    }
    if (this.vorticityProgram.uniforms.dt) {
      gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
    }
    this.blit(this.velocity.write);
    this.velocity.swap();

    // divergence
    this.divergenceProgram.bind();
    if (this.divergenceProgram.uniforms.texelSize) {
      gl.uniform2f(this.divergenceProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    }
    if (this.divergenceProgram.uniforms.uVelocity) {
      gl.uniform1i(this.divergenceProgram.uniforms.uVelocity, this.velocity.read.attach(0));
    }
    this.blit(this.divergence);

    // clear pressure
    this.clearProgram.bind();
    if (this.clearProgram.uniforms.uTexture) {
      gl.uniform1i(this.clearProgram.uniforms.uTexture, this.pressure.read.attach(0));
    }
    if (this.clearProgram.uniforms.value) {
      gl.uniform1f(this.clearProgram.uniforms.value, this.config.PRESSURE);
    }
    this.blit(this.pressure.write);
    this.pressure.swap();

    // pressure iterations
    this.pressureProgram.bind();
    if (this.pressureProgram.uniforms.texelSize) {
      gl.uniform2f(this.pressureProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    }
    if (this.pressureProgram.uniforms.uDivergence) {
      gl.uniform1i(this.pressureProgram.uniforms.uDivergence, this.divergence.attach(0));
    }
    for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
      if (this.pressureProgram.uniforms.uPressure) {
        gl.uniform1i(this.pressureProgram.uniforms.uPressure, this.pressure.read.attach(1));
      }
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    // gradient subtract
    this.gradientSubtractProgram.bind();
    if (this.gradientSubtractProgram.uniforms.texelSize) {
      gl.uniform2f(this.gradientSubtractProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    }
    if (this.gradientSubtractProgram.uniforms.uPressure) {
      gl.uniform1i(this.gradientSubtractProgram.uniforms.uPressure, this.pressure.read.attach(0));
    }
    if (this.gradientSubtractProgram.uniforms.uVelocity) {
      gl.uniform1i(this.gradientSubtractProgram.uniforms.uVelocity, this.velocity.read.attach(1));
    }
    this.blit(this.velocity.write);
    this.velocity.swap();

    // velocity advection
    this.advectionProgram.bind();
    if (this.advectionProgram.uniforms.texelSize) {
      gl.uniform2f(this.advectionProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    }
    if (!this.ext.supportLinearFiltering && this.advectionProgram.uniforms.dyeTexelSize) {
      gl.uniform2f(this.advectionProgram.uniforms.dyeTexelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    }
    const velocityId = this.velocity.read.attach(0);
    if (this.advectionProgram.uniforms.uVelocity) {
      gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocityId);
    }
    if (this.advectionProgram.uniforms.uSource) {
      gl.uniform1i(this.advectionProgram.uniforms.uSource, velocityId);
    }
    if (this.advectionProgram.uniforms.dt) {
      gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
    }
    if (this.advectionProgram.uniforms.dissipation) {
      gl.uniform1f(this.advectionProgram.uniforms.dissipation, this.config.VELOCITY_DISSIPATION);
    }
    this.blit(this.velocity.write);
    this.velocity.swap();

    // dye advection
    if (!this.ext.supportLinearFiltering && this.advectionProgram.uniforms.dyeTexelSize) {
      gl.uniform2f(this.advectionProgram.uniforms.dyeTexelSize, this.dye.texelSizeX, this.dye.texelSizeY);
    }
    if (this.advectionProgram.uniforms.uVelocity) {
      gl.uniform1i(this.advectionProgram.uniforms.uVelocity, this.velocity.read.attach(0));
    }
    if (this.advectionProgram.uniforms.uSource) {
      gl.uniform1i(this.advectionProgram.uniforms.uSource, this.dye.read.attach(1));
    }
    if (this.advectionProgram.uniforms.dissipation) {
      gl.uniform1f(this.advectionProgram.uniforms.dissipation, this.config.DENSITY_DISSIPATION);
    }
    this.blit(this.dye.write);
    this.dye.swap();
  }

  // --- Rendering ---
  render(target: FBO | null) {
    if (!this.gl) return;
    const gl = this.gl;
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    this.drawDisplay(target);
  }

  drawDisplay(target: FBO | null) {
    if (!this.gl) return;
    const gl = this.gl;
    const width = target ? target.width : (gl as WebGLRenderingContext).drawingBufferWidth;
    const height = target ? target.height : (gl as WebGLRenderingContext).drawingBufferHeight;

    this.displayMaterial.bind();

    if (this.config.SHADING && this.displayMaterial.uniforms.texelSize) {
      gl.uniform2f(this.displayMaterial.uniforms.texelSize, 1 / width, 1 / height);
    }
    if (this.displayMaterial.uniforms.uTexture) {
      gl.uniform1i(this.displayMaterial.uniforms.uTexture, this.dye.read.attach(0));
    }
    this.blit(target, false);
  }

  // --- Splatting API (velocity + dye) ---
  splat(x: number, y: number, dx: number, dy: number, color: ColorRGB) {
    if (!this.gl) return;
    const gl = this.gl;
    // velocity splat
    this.splatProgram.bind();
    if (this.splatProgram.uniforms.uTarget) {
      gl.uniform1i(this.splatProgram.uniforms.uTarget, this.velocity.read.attach(0));
    }
    if (this.splatProgram.uniforms.aspectRatio) {
      gl.uniform1f(this.splatProgram.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
    }
    if (this.splatProgram.uniforms.point) {
      gl.uniform2f(this.splatProgram.uniforms.point, x, y);
    }
    if (this.splatProgram.uniforms.color) {
      // Here in the original they pack dx,dy into color for velocity splat
      gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0);
    }
    if (this.splatProgram.uniforms.radius) {
      gl.uniform1f(this.splatProgram.uniforms.radius, correctRadius(this.config.SPLAT_RADIUS / 100, this.canvas));
    }
    this.blit(this.velocity.write);
    this.velocity.swap();

    // dye splat
    if (this.splatProgram.uniforms.uTarget) {
      gl.uniform1i(this.splatProgram.uniforms.uTarget, this.dye.read.attach(0));
    }
    if (this.splatProgram.uniforms.color) {
      gl.uniform3f(this.splatProgram.uniforms.color, color.r, color.g, color.b);
    }
    this.blit(this.dye.write);
    this.dye.swap();
  }

  splatPointer(pointer: Pointer) {
    const dx = pointer.deltaX * this.config.SPLAT_FORCE;
    const dy = pointer.deltaY * this.config.SPLAT_FORCE;
    this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
  }

  clickSplat(pointer: Pointer) {
    const color = generateColor();
    color.r *= 10;
    color.g *= 10;
    color.b *= 10;
    const dx = 10 * (Math.random() - 0.5);
    const dy = 30 * (Math.random() - 0.5);
    this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
  }

  // --- Input wiring (mount / unmount) ---
  // Note: we attach listeners, but do NOT leak—destroy() removes them.
  mountedListeners: Array<{ type: string; fn: EventListenerOrEventListenerObject; target?: EventTarget | null }> = [];

  mountInputEvents() {
    // Guard re-attach
    if (this.mountedListeners.length) return;
    // Mouse
    const mouseDown = (e: MouseEvent) => {
      const pointer = this.pointers[0];
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      updatePointerDownData(pointer, -1, posX, posY, this.canvas);
      this.clickSplat(pointer);
    };
    const firstMove = (e: MouseEvent) => {
      const pointer = this.pointers[0];
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      const color = generateColor();
      this.start();
      updatePointerMoveData(pointer, posX, posY, color, this.canvas);
      document.body.removeEventListener("mousemove", firstMove);
    };
    const move = (e: MouseEvent) => {
      const pointer = this.pointers[0];
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      const color = pointer.color;
      updatePointerMoveData(pointer, posX, posY, color, this.canvas);
    };

    // Touch
    const firstTouchStart = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const pointer = this.pointers[0];
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);
        this.start();
        updatePointerDownData(pointer, touches[i].identifier, posX, posY, this.canvas);
      }
      document.body.removeEventListener("touchstart", firstTouchStart);
    };
    const touchStart = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const pointer = this.pointers[0];
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);
        updatePointerDownData(pointer, touches[i].identifier, posX, posY, this.canvas);
      }
    };
    const touchMove = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const pointer = this.pointers[0];
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);
        updatePointerMoveData(pointer, posX, posY, pointer.color, this.canvas);
      }
    };
    const touchEnd = (e: TouchEvent) => {
      const touches = e.changedTouches;
      const pointer = this.pointers[0];
      for (let i = 0; i < touches.length; i++) {
        updatePointerUpData(pointer);
      }
    };

    // Attach (mirroring original)
    document.body.addEventListener("mousemove", firstMove);
    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", mouseDown);
    document.body.addEventListener("touchstart", firstTouchStart);
    window.addEventListener("touchstart", touchStart, false);
    window.addEventListener("touchmove", touchMove, false);
    window.addEventListener("touchend", touchEnd);

    // Keep track so we can remove later in destroy()
    this.mountedListeners.push({ type: "mousemove", fn: firstMove as EventListener, target: document.body });
    this.mountedListeners.push({ type: "mousemove", fn: move as EventListener, target: window });
    this.mountedListeners.push({ type: "mousedown", fn: mouseDown as EventListener, target: window });
    this.mountedListeners.push({ type: "touchstart", fn: firstTouchStart as EventListener, target: document.body });
    this.mountedListeners.push({ type: "touchstart", fn: touchStart as EventListener, target: window });
    this.mountedListeners.push({ type: "touchmove", fn: touchMove as EventListener, target: window });
    this.mountedListeners.push({ type: "touchend", fn: touchEnd as EventListener, target: window });
  }

  unmountInputEvents() {
    for (const rec of this.mountedListeners) {
      try {
        if (rec.target) (rec.target as any).removeEventListener(rec.type, rec.fn as EventListener);
      } catch (err) {
        // swallow
      }
    }
    this.mountedListeners = [];
  }

  // --- Public helpers to trigger splats externally (for tests/examples) ---
  addPointer(pointer: Pointer) {
    this.pointers.push(pointer);
  }

  triggerSplatAt(x: number, y: number, dx = 0, dy = 0, color?: ColorRGB) {
    this.splat(x, y, dx, dy, color || generateColor());
  }

  // --- Cleanup ---
  destroy() {
    this.stop();
    this.unmountInputEvents();
    // Note: we do not explicitly delete GL programs/textures here.
    // The browser will free them when the context is lost / GCed.
    // If you want explicit deletion, add it here.
  }
}
