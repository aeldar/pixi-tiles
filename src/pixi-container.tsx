import { useEffect, useRef } from "react";
import { Application } from "pixi.js";
import { createPixiApp } from "./pixi/create-pixi-app";

export function PixiContainer({
  width = 800,
  height = 600,
  background = 0x1099bb,
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    (async () => {
      if (!containerRef.current) return;
      const app = await createPixiApp(containerRef.current);
      appRef.current = app;
      containerRef.current.appendChild(app.canvas);
      return () => {
        if (app.canvas.parentNode) {
          app.canvas.parentNode.removeChild(app.canvas);
        }
        app.destroy(true, { children: true });
      };
    })();
  }, [width, height, background]);

  return (
    <div
      style={{ width, height, background: `#${background.toString(16)}` }}
      ref={containerRef}
    />
  );
}
