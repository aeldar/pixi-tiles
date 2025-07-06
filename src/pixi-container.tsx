import { useEffect, useRef, useState } from "react";
import { Application } from "pixi.js";
import { createPixiApp } from "./pixi-app/create-pixi-app";

declare global {
  var __PIXI_APP__: Application | undefined;
}

export function PixiContainer({
  width = 800,
  height = 600,
  background = 0x1099bb,
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [app, setApp] = useState<Application | null>(null);

  useEffect(() => {
    (async () => {
      // skip if no container
      if (!containerRef.current) return;
      // TODO: destroy the app on unmounts
      const pixiApp = await createPixiApp(containerRef.current);
      setApp(pixiApp);
    })();
  }, []);

  useEffect(() => {
    if (!app) return;
    // add pixi app to dom
    if (!containerRef.current) return;

    containerRef.current.appendChild(app.canvas);

    // Set the app to the global variable for Pixi Dev Tools.
    globalThis.__PIXI_APP__ = app;

    return () => {
      // Clean up the app when the component unmounts
      if (app && app.canvas && containerRef.current) {
        containerRef.current.removeChild(app.canvas);
        app.destroy(true, { children: true });
      }
      globalThis.__PIXI_APP__ = undefined;
    };

  }, [app]);

  return (
    <div
      style={{ width, height, background: `#${background.toString(16)}` }}
      ref={containerRef}
    />
  );
}
