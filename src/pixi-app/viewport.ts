import type { Application } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { isOnHandleZoomedEnd } from '../tiles/on-handle-zoom-end';

export function createViewport(app: Application) {
  const viewport = new Viewport({
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
    worldWidth: 1000,
    worldHeight: 1000,
    events: app.renderer.events,
  });

  // Enable basic plugins
  viewport.drag().pinch().wheel().decelerate();

  // Listen for the 'zoomed-end' event and log it
  viewport.on('zoomed-end', (event) => {
    viewport.getChildrenByLabel('tiled-document').forEach((doc) => {
      if (isOnHandleZoomedEnd(doc)) {
        doc.handleZoomedEnd(event);
      }
    });
  });

  return viewport;
}