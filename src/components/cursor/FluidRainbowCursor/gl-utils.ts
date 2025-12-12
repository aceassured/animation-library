// src/FluidRainbowCursor/gl-utils.ts

/**
 * WebGL context + format detection interfaces
 */

export interface GLContextInfo {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  isWebGL2: boolean;
  ext: {
    supportLinearFiltering: boolean;
    halfFloatTexType: number;
    formatRGBA: any;
    formatRG: any;
    formatR: any;
  };
}

/**
 * Try to initialize WebGL2 → then fallback to WebGL1.
 */
export function getWebGLContext(
  canvas: HTMLCanvasElement
): GLContextInfo | null {
  const params: WebGLContextAttributes = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  let gl = canvas.getContext("webgl2", params) as
    | WebGL2RenderingContext
    | WebGLRenderingContext
    | null;

  if (!gl) {
    gl = (canvas.getContext("webgl", params) ||
      canvas.getContext(
        "experimental-webgl",
        params
      )) as WebGLRenderingContext | null;
  }

  if (!gl) return null;

  const isWebGL2 = "drawBuffers" in gl;

  let supportLinearFiltering = false;
  let halfFloat: any = null;

  if (isWebGL2) {
    (gl as WebGL2RenderingContext).getExtension("EXT_color_buffer_float");
    supportLinearFiltering = !!(gl as WebGL2RenderingContext).getExtension(
      "OES_texture_float_linear"
    );
  } else {
    halfFloat = gl.getExtension("OES_texture_half_float");
    supportLinearFiltering = !!gl.getExtension("OES_texture_half_float_linear");
  }

  const halfFloatTexType = isWebGL2
    ? (gl as WebGL2RenderingContext).HALF_FLOAT
    : (halfFloat && halfFloat.HALF_FLOAT_OES) || 0;

  // Format detection
  const formatRGBA = getSupportedFormat(
    gl,
    isWebGL2 ? (gl as WebGL2RenderingContext).RGBA16F : gl.RGBA,
    gl.RGBA,
    halfFloatTexType
  );
  const formatRG = getSupportedFormat(
    gl,
    isWebGL2 ? (gl as WebGL2RenderingContext).RG16F : gl.RGBA,
    isWebGL2 ? (gl as WebGL2RenderingContext).RG : gl.RGBA,
    halfFloatTexType
  );
  const formatR = getSupportedFormat(
    gl,
    isWebGL2 ? (gl as WebGL2RenderingContext).R16F : gl.RGBA,
    isWebGL2 ? (gl as WebGL2RenderingContext).RED : gl.RGBA,
    halfFloatTexType
  );

  gl.clearColor(0, 0, 0, 1);

  return {
    gl,
    isWebGL2,
    ext: {
      supportLinearFiltering,
      halfFloatTexType,
      formatRGBA,
      formatRG,
      formatR,
    },
  };
}

/**
 * Check if a texture render format is supported.
 */
function supportRenderTextureFormat(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  internalFormat: number,
  format: number,
  type: number
): boolean {
  const texture = gl.createTexture();
  if (!texture) return false;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  if (!fbo) return false;

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

  return status === gl.FRAMEBUFFER_COMPLETE;
}

/**
 * Try to find a supported format. (Original cascading logic preserved)
 */
function getSupportedFormat(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  internalFormat: number,
  format: number,
  type: number
) {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    if ("drawBuffers" in gl) {
      const gl2 = gl as WebGL2RenderingContext;
      switch (internalFormat) {
        case gl2.R16F:
          return getSupportedFormat(gl2, gl2.RG16F, gl2.RG, type);
        case gl2.RG16F:
          return getSupportedFormat(gl2, gl2.RGBA16F, gl2.RGBA, type);
        default:
          return null;
      }
    }
    return null;
  }

  return { internalFormat, format };
}

/**
 * Compile a shader with optional #define keywords.
 */
export function compileShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string,
  keywords: string[] | null = null
): WebGLShader | null {
  const finalSource = addKeywords(source, keywords);

  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, finalSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("Shader compile error:", gl.getShaderInfoLog(shader));
  }

  return shader;
}

/**
 * Add "#define KEYWORD" at the top of shader source.
 */
function addKeywords(source: string, keywords: string[] | null) {
  if (!keywords || keywords.length === 0) return source;

  let header = "";
  for (const k of keywords) header += `#define ${k}\n`;

  return header + source;
}

/**
 * Create a program from vertex + fragment shaders.
 */
export function createProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vs: WebGLShader | null,
  fs: WebGLShader | null
): WebGLProgram | null {
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("Program link error:", gl.getProgramInfoLog(program));
  }

  return program;
}

/**
 * Extract uniform references from a linked program.
 */
export function getUniforms(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram
) {
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
  }

  return uniforms;
}

/**
 * OOP Wrapper for WebGLProgram (matches original Program class)
 */
export class GLProgram {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  program: WebGLProgram | null;
  uniforms: Record<string, WebGLUniformLocation | null>;

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vs: WebGLShader | null,
    fs: WebGLShader | null
  ) {
    this.gl = gl;
    this.program = createProgram(gl, vs, fs);
    this.uniforms = this.program ? getUniforms(gl, this.program) : {};
  }

  bind() {
    if (this.program) this.gl.useProgram(this.program);
  }
}

/**
 * A Material that supports multiple keyword-based variants.
 */
export class GLMaterial {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  vertexShader: WebGLShader | null;
  fragmentSource: string;
  programs: Record<number, WebGLProgram | null>;
  activeProgram: WebGLProgram | null;
  uniforms: Record<string, WebGLUniformLocation | null>;

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexShader: WebGLShader | null,
    fragmentSource: string
  ) {
    this.gl = gl;
    this.vertexShader = vertexShader;
    this.fragmentSource = fragmentSource;
    this.programs = {};
    this.activeProgram = null;
    this.uniforms = {};
  }

  private static hashKeywords(words: string[]) {
    let hash = 0;
    for (const w of words) {
      for (let i = 0; i < w.length; i++) {
        hash = (hash << 5) - hash + w.charCodeAt(i);
        hash |= 0;
      }
    }
    return hash;
  }

  setKeywords(keywords: string[]) {
    const gl = this.gl;

    const hash = GLMaterial.hashKeywords(keywords);
    let program = this.programs[hash];

    if (!program) {
      const fs = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        this.fragmentSource,
        keywords
      );
      program = createProgram(gl, this.vertexShader, fs);
      this.programs[hash] = program || null;
    }

    if (program !== this.activeProgram) {
      this.activeProgram = program || null;
      if (this.activeProgram)
        this.uniforms = getUniforms(gl, this.activeProgram);
    }
  }

  bind() {
    if (this.activeProgram) this.gl.useProgram(this.activeProgram);
  }
}
