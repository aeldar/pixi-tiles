import * as PIXI from 'pixi.js';
import { INITIAL_WORLD_DOCUMENT_WIDTH } from './constants';
import { createTiledDocument, scaleContainerToWidth } from './create-tiled-documents';
import { DOCUMENT_IDS, documentSizes, type DocumentId, type Lod } from './mock-meta-data';
import type { TiledDocument } from './tiled-document';
import { createViewport } from './viewport';

const GRID_OFFSET_X = 20; // px
const GRID_OFFSET_Y = 20; // px
const INITIAL_GRID_OFFSET_X = 30; // px
const INITIAL_GRID_OFFSET_Y = 100; // px

function nextToX(pixiObject: PIXI.Container, offsetX = GRID_OFFSET_X): number {
  return pixiObject.position.x + pixiObject.width + offsetX;
}

function nextToY(pixiObject: PIXI.Container, offsetY = GRID_OFFSET_Y): number {
  return pixiObject.position.y + pixiObject.height + offsetY;
}

function addDebugNote(viewport: PIXI.Container, text: string, x: number, y: number): PIXI.BitmapText {
  const note = new PIXI.BitmapText({ text });
  note.position.set(x, y);
  viewport.addChild(note);
  return note;
}

function debugNoteForDocument(
  lod: Lod,
  sizes: [number, number],
  documentX: number,
  documentY: number,
): PIXI.BitmapText {
  const text = `${sizes.join('x')}`;
  const bText = new PIXI.BitmapText({ text, style: { fontSize: 12, fill: '#333', stroke: 'transparent' } });
  bText.position.set(documentX, documentY - 14);
  return bText;
}

function addDocumentsRow(
  viewport: PIXI.Container,
  documents: Readonly<DocumentId[]>,
  lod: Lod,
  yOffset: number,
): TiledDocument[] {
  const tileDocuements = documents.map((documentId, index) => {
    const tiledDocument = createTiledDocument(documentId, lod);

    scaleContainerToWidth(INITIAL_WORLD_DOCUMENT_WIDTH, tiledDocument);
    tiledDocument.position.set(INITIAL_GRID_OFFSET_X + index * (tiledDocument.width + GRID_OFFSET_X), yOffset);
    viewport.addChild(tiledDocument);

    const debugNote = debugNoteForDocument(
      lod,
      documentSizes(documentId)[lod],
      tiledDocument.position.x,
      tiledDocument.position.y,
    );
    viewport.addChild(debugNote);

    return tiledDocument;
  });

  const debugNote = `LOD ${lod}`;
  addDebugNote(viewport, `LOD ${lod}`, nextToX(tileDocuements[tileDocuements.length - 1]) + GRID_OFFSET_X, yOffset);

  return tileDocuements;
}

function addDocument(viewport: PIXI.Container, documentId: DocumentId, posX: number, posY: number): void {
  const lod = 0; // For now, we use the lowest LOD
  const tiledDocument = createTiledDocument(documentId, lod);
  scaleContainerToWidth(INITIAL_WORLD_DOCUMENT_WIDTH, tiledDocument);
  tiledDocument.position.set(posX, posY);
  viewport.addChild(tiledDocument);
  const sizes = documentSizes(documentId)[lod];
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