import { Viewport } from 'pixi-viewport';
import * as PIXI from 'pixi.js';
import { isOnHandleZoomedEnd } from './tiled-document';

// The Viewport is actually coming as a payload to the `zoomed-end` event from  pixi-viewport
type ZoomedEndEvent = Viewport;

export function createViewport(app: PIXI.Application) {
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
  viewport.on('zoomed-end', () => {
    viewport.getChildrenByLabel('tiled-document').forEach((doc) => {
      if (isOnHandleZoomedEnd(doc)) {
        doc.handleZoomedEnd();
      }
    });
  });

  return viewport;
}