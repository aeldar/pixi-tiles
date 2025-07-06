import * as PIXI from 'pixi.js';
import { INITIAL_WORLD_DOCUMENT_WIDTH } from './constants';
import { createTiledDocument, scaleContainerToWidth } from './create-tiled-documents';
import { DOCUMENT_IDS, type DocumentId } from './mock-meta-data';
import { createViewport } from './viewport';

const INITIAL_GRID_OFFSET_X = 30; // px
const INITIAL_GRID_OFFSET_Y = 100; // px

function addDocument(viewport: PIXI.Container, documentId: DocumentId, posX: number, posY: number): void {
  const tiledDocument = createTiledDocument(documentId);
  scaleContainerToWidth(INITIAL_WORLD_DOCUMENT_WIDTH, tiledDocument);
  tiledDocument.position.set(posX, posY);
  viewport.addChild(tiledDocument);
}

export async function createPixiApp(container: HTMLDivElement) {
  const app = new PIXI.Application();
  await app.init({
    resizeTo: container,
    backgroundColor: 'lightblue',
  });

  // Create viewport and add to stage
  const viewport = createViewport(app);
  app.stage.addChild(viewport);

  addDocument(viewport, DOCUMENT_IDS[2], INITIAL_GRID_OFFSET_X, INITIAL_GRID_OFFSET_Y);

  return app;
}