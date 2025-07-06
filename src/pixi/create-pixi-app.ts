import * as PIXI from "pixi.js";
import { INITIAL_WORLD_DOCUMENT_WIDTH } from "./constants";
import { createTiledDocument } from "./create-tiled-documents";
import { DOCUMENT_IDS, type DocumentId } from "./mock-meta-data";
import { createViewport } from "./viewport";

type Size = { w: number; h: number };

const INITIAL_GRID_OFFSET_X = 30; // px
const INITIAL_GRID_OFFSET_Y = 100; // px

/**
 * Scales a size object to a new width while maintaining the aspect ratio.
 */
function scaledToWidth(targetWidth: number, size: Size): Size {
  return {
    w: targetWidth,
    h: (size.h * targetWidth) / size.w,
  };
}

/**
 * Scales a PIXI.Container to a new width while maintaining the aspect ratio.
 */
function scaleContainerToWidth(
  targetWidth: number,
  container: PIXI.Container
): void {
  const { w, h } = scaledToWidth(targetWidth, {
    w: container.width,
    h: container.height,
  });
  container.width = w;
  container.height = h;
}

/**
 * Adds a document to the viewport at the specified position.
 */
function addDocument(
  viewport: PIXI.Container,
  documentId: DocumentId,
  posX: number,
  posY: number
): void {
  const tiledDocument = createTiledDocument(documentId);
  scaleContainerToWidth(INITIAL_WORLD_DOCUMENT_WIDTH, tiledDocument);
  tiledDocument.position.set(posX, posY);
  viewport.addChild(tiledDocument);
}

export async function createPixiApp(container: HTMLDivElement) {
  const app = new PIXI.Application();
  await app.init({
    resizeTo: container,
    backgroundColor: "lightblue",
  });

  // Create viewport and add to stage
  const viewport = createViewport(app);
  app.stage.addChild(viewport);

  // add all documents to the viewport
  DOCUMENT_IDS.forEach((documentId, idx) => {
    addDocument(
      viewport,
      documentId,
      INITIAL_GRID_OFFSET_X + INITIAL_WORLD_DOCUMENT_WIDTH * idx + 50 * idx,
      INITIAL_GRID_OFFSET_Y // Adjust Y offset for each document
    );
  });

  return app;
}
