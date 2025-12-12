// src/FluidRainbowCursor/pointers.ts

import { ColorRGB, Pointer } from "./types";
import { generateColor } from "./colors";

/**
 * Update pointer (mouse/touch) when pressed
 */
export function updatePointerDownData(
  pointer: Pointer,
  id: number,
  posX: number,
  posY: number,
  canvas: HTMLCanvasElement
) {
  pointer.id = id;
  pointer.down = true;
  pointer.moved = false;

  pointer.texcoordX = posX / canvas.width;
  pointer.texcoordY = 1 - posY / canvas.height;

  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;

  pointer.deltaX = 0;
  pointer.deltaY = 0;

  pointer.color = generateColor();
}

/**
 * Update pointer on move
 */
export function updatePointerMoveData(
  pointer: Pointer,
  posX: number,
  posY: number,
  color: ColorRGB,
  canvas: HTMLCanvasElement
) {
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;

  pointer.texcoordX = posX / canvas.width;
  pointer.texcoordY = 1 - posY / canvas.height;

  pointer.deltaX = correctDeltaX(
    pointer.texcoordX - pointer.prevTexcoordX,
    canvas
  );
  pointer.deltaY = correctDeltaY(
    pointer.texcoordY - pointer.prevTexcoordY,
    canvas
  );

  pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;

  pointer.color = color;
}

/**
 * Update on release
 */
export function updatePointerUpData(pointer: Pointer) {
  pointer.down = false;
}

/**
 * Delta corrections for aspect ratio
 */
export function correctDeltaX(delta: number, canvas: HTMLCanvasElement) {
  const aspect = canvas.width / canvas.height;
  if (aspect < 1) delta *= aspect;
  return delta;
}

export function correctDeltaY(delta: number, canvas: HTMLCanvasElement) {
  const aspect = canvas.width / canvas.height;
  if (aspect > 1) delta /= aspect;
  return delta;
}

/**
 * Radius correction
 */
export function correctRadius(radius: number, canvas: HTMLCanvasElement) {
  const aspect = canvas.width / canvas.height;
  if (aspect > 1) radius *= aspect;
  return radius;
}

/**
 * Basic splat trigger (used in simulation.ts)
 */
export function splatPointer(
  pointer: Pointer,
  config: { SPLAT_FORCE: number },
  splat: (x: number, y: number, dx: number, dy: number, color: ColorRGB) => void
) {
  const dx = pointer.deltaX * config.SPLAT_FORCE;
  const dy = pointer.deltaY * config.SPLAT_FORCE;

  splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
}

/**
 * Burst splat when user clicks
 * (Exactly same math as original)
 */
export function clickSplat(
  pointer: Pointer,
  splat: (x: number, y: number, dx: number, dy: number, color: ColorRGB) => void
) {
  const color = generateColor();
  color.r *= 10;
  color.g *= 10;
  color.b *= 10;

  const dx = 10 * (Math.random() - 0.5);
  const dy = 30 * (Math.random() - 0.5);

  splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
}

/**
 * Convert pixel coordinate → canvas device pixel ratio scaled value
 */
export function scaleByPixelRatio(input: number) {
  const pixelRatio = window.devicePixelRatio || 1;
  return Math.floor(input * pixelRatio);
}
