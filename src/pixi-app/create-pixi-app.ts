import * as PIXI from "pixi.js";
import { DOCUMENT_IDS, type DocumentId } from "../tiles/mock-meta-data";
import { createViewport } from "./viewport";
import { createTiledDocument } from "../tiles/tiled-document";
import type { Size } from "../tiles/factories";

const INITIAL_DOCUMENT_WIDTH = 200; // px
const INITIAL_GRID_OFFSET_X = 30; // px
const INITIAL_GRID_OFFSET_Y = 100; // px

/**
 * Scales a size object to a new width while maintaining the aspect ratio.
 */
function scaledSizeToWidth(targetWidth: number, size: Size): Size {
  return [targetWidth, (size[1] * targetWidth) / size[0]];
}

/**
 * Scales a PIXI.Container to a new width while maintaining the aspect ratio.
 */
function scaleContainerToWidth(c: PIXI.Container, targetWidth: number): void {
  const [_, targetHeight] = scaledSizeToWidth(targetWidth, [c.width, c.height]);
  c.width = targetWidth;
  c.height = targetHeight;
}

/**
 * Adds a document to the viewport at the specified position.
 */
function addDocumentToContainer(
  viewport: PIXI.Container,
  documentId: DocumentId,
  posX: number,
  posY: number
): void {
  const tiledDocument = createTiledDocument(documentId);
  scaleContainerToWidth(tiledDocument, INITIAL_DOCUMENT_WIDTH);
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
    addDocumentToContainer(
      viewport,
      documentId,
      INITIAL_GRID_OFFSET_X + INITIAL_DOCUMENT_WIDTH * idx + 50 * idx,
      INITIAL_GRID_OFFSET_Y // Adjust Y offset for each document
    );
  });

  return app;
}
