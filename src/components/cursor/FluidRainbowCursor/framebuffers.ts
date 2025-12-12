// src/FluidRainbowCursor/framebuffers.ts
import {
  GLProgram
} from "./gl-utils";

export interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

export interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

/**
 * Create a framebuffer object (single FBO)
 */
export function createFBO(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number
): FBO {
  gl.activeTexture(gl.TEXTURE0);

  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    internalFormat,
    w,
    h,
    0,
    format,
    type,
    null
  );

  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    texture,
    fbo,
    width: w,
    height: h,
    texelSizeX: 1 / w,
    texelSizeY: 1 / h,
    attach: (id: number) => {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    }
  };
}

/**
 * Create a double-buffered FBO (ping-pong)
 */
export function createDoubleFBO(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number
): DoubleFBO {
  const fbo1 = createFBO(gl, w, h, internalFormat, format, type, filter);
  const fbo2 = createFBO(gl, w, h, internalFormat, format, type, filter);

  return {
    width: w,
    height: h,
    texelSizeX: fbo1.texelSizeX,
    texelSizeY: fbo1.texelSizeY,
    read: fbo1,
    write: fbo2,
    swap() {
      const temp = this.read;
      this.read = this.write;
      this.write = temp;
    }
  };
}

/**
 * Resize single FBO (used inside resizeDoubleFBO)
 */
export function resizeFBO(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  target: FBO,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
  copyProgram: GLProgram,
  blit: (target: FBO | null, clear?: boolean) => void
): FBO {
  const newFBO = createFBO(gl, w, h, internalFormat, format, type, filter);

  copyProgram.bind();
  if (copyProgram.uniforms.uTexture) {
    gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
  }

  blit(newFBO);

  return newFBO;
}

/**
 * Resize DoubleFBO while preserving texture contents
 */
export function resizeDoubleFBO(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  target: DoubleFBO,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
  copyProgram: GLProgram,
  blit: (target: FBO | null, clear?: boolean) => void
): DoubleFBO {
  if (target.width === w && target.height === h) return target;

  target.read = resizeFBO(gl, target.read, w, h, internalFormat, format, type, filter, copyProgram, blit);
  target.write = createFBO(gl, w, h, internalFormat, format, type, filter);

  target.width = w;
  target.height = h;
  target.texelSizeX = 1 / w;
  target.texelSizeY = 1 / h;

  return target;
}
