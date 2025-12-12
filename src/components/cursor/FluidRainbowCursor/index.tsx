// src/FluidRainbowCursor/index.tsx
import React, { useEffect, useRef } from "react";
import { FluidSimulation, defaultConfig, SimulationConfig } from "./simulation";

/**
 * Props = Same as SimulationConfig, but optional
 */
export interface FluidRainbowCursorProps extends Partial<SimulationConfig> {}

/**
 * FluidRainbowCursor Component
 *
 * ✔ Fully library-safe
 * ✔ Uses FluidSimulation internally
 * ✔ No global leaks — cleaned on unmount
 */
const FluidRainbowCursor: React.FC<FluidRainbowCursorProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<FluidSimulation | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config: SimulationConfig = {
      ...defaultConfig(),
      ...props,
    };

    // Create simulation
    const sim = new FluidSimulation(canvas, config);
    simulationRef.current = sim;

    // Attach input listeners after sim init
    sim.mountInputEvents();

    return () => {
      sim.destroy();
      simulationRef.current = null;
    };
  }, [
    props.SIM_RESOLUTION,
    props.DYE_RESOLUTION,
    props.CAPTURE_RESOLUTION,
    props.DENSITY_DISSIPATION,
    props.VELOCITY_DISSIPATION,
    props.PRESSURE,
    props.PRESSURE_ITERATIONS,
    props.CURL,
    props.SPLAT_RADIUS,
    props.SPLAT_FORCE,
    props.SHADING,
    props.COLOR_UPDATE_SPEED,
    props.BACK_COLOR,
    props.TRANSPARENT,
  ]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100vw",
          height: "100vh",
          display: "block",
        }}
      />
    </div>
  );
};

export default FluidRainbowCursor;
