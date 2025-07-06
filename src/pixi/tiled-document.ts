import type { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { TILE_SIZE_PX } from "./constants";
import {
  addInvisibleBounds,
  createEmptySprite,
  removeInvisibleBounds,
} from "./create-tiled-documents";
import {
  delay,
  documentSizes,
  tileImgUrlsForDocumentAndLod,
  type DocumentId,
  type Lod,
} from "./mock-meta-data";
import { getOptimalLodForWidth, type Size } from "./tile-utils";

export class TiledDocument extends PIXI.Container implements OnHandleZoomedEnd {
  readonly label = "tiled-document";
  readonly #documentId: DocumentId;
  readonly #sizesPerLod: readonly Size[];

  // We have to maintain the bounds whenever the internal LOD changes.
  // These are set during the initialisation only.
  readonly #localWidth: number;
  readonly #localHeight: number;

  #lod: Lod = 0;

  #tilesContainer: PIXI.Container | null = null;

  debug = false;

  handleZoomedEnd(): void {
    // Real world width of this Container.
    const globalWidth = this.getBounds().width;

    // Get the optimal LOD for the current width.
    const optimalLod = this.#getOptimalLodForWidth(globalWidth);

    if (this.#lod !== optimalLod) {
      // Remove tiles and add new ones
      this.#removeTiles();
      this.#tilesContainer = this.#addTiles(optimalLod);
      this.addChild(this.#tilesContainer);
      // Restore the internal size of tiled container to prevent resizing issues.
      this.#tilesContainer.setSize(this.#localWidth, this.#localHeight);

      // LOD has been changed
      this.#lod = optimalLod;
    }
  }

  constructor(documentId: DocumentId, initialLod: Lod = 0) {
    super();
    this.#documentId = documentId;
    this.#sizesPerLod = documentSizes(this.#documentId);

    // TODO: check the best LOD on initialisation
    this.#lod = initialLod;
    const [width, height] = this.#getSizeForLod(initialLod);
    // Save original width and height.
    // It doesn't matter which LOD to use, what matters is aspect ratio and persistence of the size.
    this.#localWidth = width;
    this.#localHeight = height;

    // Add transparent bounds.
    // Can be replaced with a background, invisible bounds, or removed completely.
    const bounds = addInvisibleBounds(this.#localWidth, this.#localHeight);
    this.addChild(bounds);

    // Add tiled container.
    this.#tilesContainer = this.#addTiles(initialLod);
    this.addChild(this.#tilesContainer);
  }

  #getOptimalLodForWidth(width: number): Lod {
    // width = width * 3; // TODO: remove after debugging.
    // Determine the optimal LOD based on the width of the document
    return getOptimalLodForWidth(this.#sizesPerLod)(width);
  }

  #getSizeForLod(lod: Lod): Size {
    return this.#sizesPerLod[lod];
  }

  #removeTiles() {
    if (!this.#tilesContainer) {
      console.warn("No tiles container to remove");
      return;
    }
    // Remove all tiles from the container
    if (this.#tilesContainer) {
      this.removeChild(this.#tilesContainer);
    }

    return;
  }

  #addTiles(lod: Lod): PIXI.Container {
    const c = new PIXI.Container();
    const [width, height] = this.#getSizeForLod(lod);
    c.label = "tiles-container";
    // Store the original size before adding tiles

    // Create tiles and add them to the container
    const urlMatrix = tileImgUrlsForDocumentAndLod(this.#documentId, lod);

    urlMatrix.forEach((row, rowIndex) => {
      row.forEach((url, columnIndex) => {
        // calculate last row and column corrections for the sprite size.
        const isLastRow = rowIndex === urlMatrix.length - 1;
        const isLastCol = columnIndex === row.length - 1;
        const spriteWidth = isLastCol
          ? width % TILE_SIZE_PX || TILE_SIZE_PX
          : TILE_SIZE_PX;
        const spriteHeight = isLastRow
          ? height % TILE_SIZE_PX || TILE_SIZE_PX
          : TILE_SIZE_PX;

        const sprite = createEmptySprite(spriteWidth, spriteHeight);

        sprite.setSize(spriteWidth, spriteHeight);
        sprite.position.set(
          columnIndex * TILE_SIZE_PX,
          rowIndex * TILE_SIZE_PX
        );

        c.addChild(sprite);

        PIXI.Assets.load(url)
          // simulate network delay
          .then(delay(Math.random() * 1000))
          .then((texture) => {
            sprite.texture = texture;
            sprite.label = "tile";
            sprite.setSize(spriteWidth, spriteHeight);
          });
      });
    });

    return c;
  }
}

interface OnHandleZoomedEnd {
  handleZoomedEnd: (event: Viewport) => void;
}

export function isOnHandleZoomedEnd(obj: object): obj is TiledDocument {
  return "handleZoomedEnd" in obj && typeof obj.handleZoomedEnd === "function";
}
