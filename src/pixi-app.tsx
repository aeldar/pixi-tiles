import { useEffect, useRef } from "react";
import { Application } from "pixi.js";

export function PixiApp({ width = 800, height = 600, background = 0x1099bb }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    (async () => {
      if (!containerRef.current) return;
      // Use the recommended static create method for Application in PixiJS v8+
      const app = new Application();
      app.init({ width, height, background });
      appRef.current = app;
      containerRef.current.appendChild(app.canvas);
      return () => {
        app.destroy(true, { children: true });
        if (app.canvas.parentNode) {
          app.canvas.parentNode.removeChild(app.canvas);
        }
      };
    })();
  }, [width, height, background]);

  return <div ref={containerRef} />;
}
